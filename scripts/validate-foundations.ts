import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { validateFoundationsManifest, validateJava8Source, validateTranslations } from "../src/lib/foundations/validate.ts";
import { compare } from "../src/lib/harness/compare.ts";
import type { ExerciseContent, ExercisePrivate, FoundationsManifest, LessonContent, ModuleContent, Checkpoint, CheckpointPrivate } from "../src/lib/foundations/types";

const root = path.resolve(".");
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8"));
const normalize = (value: unknown) => String(value ?? "").replace(/\r\n?/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").replace(/\n+$/, "");
export function assertPublicContent(value: unknown) {
  if (Array.isArray(value)) value.forEach(assertPublicContent);
  else if (record(value)) for (const [key, child] of Object.entries(value)) {
    assert(!["hiddenCases", "referenceSolution", "referenceSolutions", "correctOptionId", "correctAnswer", "answers", "privateData"].includes(key), `Private field in public content: ${key}`);
    assertPublicContent(child);
  }
}
function prose(value: unknown, blocklist: string[]) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const phrase of blocklist) assert(!serialized.includes(phrase.toLowerCase()), `Blocked phrase: ${phrase}`);
}
export function validateExerciseContent(exercise: ExerciseContent, privatePack: ExercisePrivate) {
  assertPublicContent(exercise);
  const warnings = validateTranslations(exercise);
  assert.equal(privatePack.exerciseId, exercise.id, "Mismatched private pack");
  assert.equal(exercise.track, "foundations");
  assert.equal(exercise.javaMinVersion, 8);
  assert(exercise.starterCode.trim(), "Missing Java sample or starter");
  validateJava8Source(exercise.starterCode);
  assert.equal(exercise.translations.en.hints.length, 3);
  assert.equal(new Set(exercise.translations.en.hints).size, 3);
  assert(exercise.translations.en.title.trim() && exercise.translations.en.statement.trim());
  assert(privatePack.explanations.en?.trim(), "Missing English answer explanation");
  for (const language of ["en", "fil", "ceb"] as const) {
    const explanation = privatePack.explanations[language];
    assert(explanation === null || typeof explanation === "string" && explanation.trim(), `Missing answer explanation status: ${language}`);
    if (exercise.translations[language] !== null) assert(typeof explanation === "string" && explanation.trim(), `Untranslated answer explanation: ${language}`);
  }
  if (exercise.kind === "predict") {
    assert(exercise.translations.en.options.length >= 2, "Predict requires options");
    assert.equal(new Set(exercise.translations.en.options.map(option => option.id)).size, exercise.translations.en.options.length, "Duplicate predict option IDs");
    assert(exercise.translations.en.options.some(option => option.id === privatePack.correctOptionId), "Invalid predict key");
  } else {
    assert(exercise.starterCode.trim() && privatePack.referenceSolution?.trim(), "Missing Java source");
    assert(privatePack.referenceSolution, "Missing Java reference");
    validateJava8Source(privatePack.referenceSolution);
    assert.equal(exercise.cases.length, 3, "Expected three visible cases");
    assert(privatePack.hiddenCases.length >= 5, "Expected at least five hidden cases");
    const cases = [...exercise.cases, ...privatePack.hiddenCases];
    assert.equal(new Set(cases.map(test => test.id)).size, cases.length, "Duplicate cases");
    assert(cases.some(test => test.boundary === true), "Mark an empty or boundary case explicitly");
    for (const test of cases) {
      assert(test.id && Array.isArray(test.input) && Object.hasOwn(test, "expected"), "Malformed Java case");
      if (exercise.ioMode === "program") assert(typeof test.stdin === "string" && typeof test.expected === "string", "Programs require raw stdin and stdout strings");
    }
    if (exercise.ioMode === "function") assert(exercise.functionName && Array.isArray(exercise.javaParams), "Missing Java method signature");
  }
  return warnings;
}
export function validateReference(exercise: ExerciseContent, privatePack: ExercisePrivate) {
  assert(privatePack.referenceSolution, "Missing reference source");
  validateJava8Source(privatePack.referenceSolution);
  const directory = path.join(root, "artifacts", "foundations-validation");
  fs.mkdirSync(directory, { recursive: true });
  const cwd = fs.mkdtempSync(path.join(directory, "java-"));
  let source = privatePack.referenceSolution;
  const cases = [...exercise.cases, ...privatePack.hiddenCases];
  if (exercise.ioMode === "function") {
    const imports = source.match(/^\s*import\s+[^;]+;/gm) ?? [];
    const code = source.replace(/^\s*import\s+[^;]+;/gm, "").replace(/public\s+class\s+Solution\b/g, "class Solution");
    source = imports.join("\n") + "\n" + fs.readFileSync("public/runners/JavaHarness.txt", "utf8").replace("/* IWONS_USER_CODE */", () => code);
  }
  fs.writeFileSync(path.join(cwd, "Main.java"), source);
  const compiled = spawnSync("javac", ["--release", "8", "Main.java"], { cwd, encoding: "utf8", timeout: 30000 });
  assert.equal(compiled.status, 0, `Java 8 compilation failed: ${compiled.error?.message ?? compiled.stderr}`);
  if (exercise.ioMode === "program") {
    for (const test of cases) {
      const result = spawnSync("java", ["-cp", cwd, "Main"], { cwd, input: test.stdin, encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024 });
      assert.equal(result.status, 0, `${test.id}: ${result.error?.message ?? result.stderr}`);
      assert.equal(normalize(result.stdout), normalize(test.expected), `${exercise.id}: ${test.id}`);
    }
  } else {
    const result = spawnSync("java", ["-cp", cwd, "Main"], { cwd, input: JSON.stringify({ ...exercise, mode: "function", cases }), encoding: "utf8", timeout: 10000, maxBuffer: 5 * 1024 * 1024 });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.verdict, "accepted", result.stdout);
    assert.equal(output.cases.length, cases.length);
    for (const [index, test] of cases.entries()) assert(compare(output.cases[index].actual, test.expected, exercise.comparison), `${exercise.id}: ${test.id}`);
  }
  return cases.length;
}
export function validateFoundationsModule(manifest: FoundationsManifest, moduleId: string) {
  validateFoundationsManifest(manifest);
  const courseModule = manifest.modules.find(courseModule => courseModule.id === moduleId);
  assert(courseModule, `Unknown module: ${moduleId}`);
  const directory = path.join("src/data/foundations", courseModule.courseId, courseModule.slug);
  const blocklist = fs.readFileSync("scripts/blocklist.txt", "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#"));
  const intro = read<ModuleContent>(path.join(directory, "module.json"));
  assert.equal(intro.id, courseModule.id);
  assertPublicContent(intro);
  const warnings = validateTranslations(intro);
  const words = intro.translations.en.intro.trim().split(/\s+/).length;
  assert(words >= 150 && words <= 250, "Module intro must contain 150–250 English words");
  prose(intro.translations, blocklist);
  for (const lesson of manifest.lessons.filter(lesson => lesson.moduleId === moduleId)) {
    const content = read<LessonContent>(path.join(directory, `${lesson.slug}.json`));
    for (const key of Object.keys(lesson) as (keyof typeof lesson)[]) assert.deepEqual(content[key], lesson[key], `Manifest mismatch: ${lesson.id}.${key}`);
    assertPublicContent(content);
    warnings.push(...validateTranslations(content));
    validateJava8Source(content.javaExample);
    assert(content.translations.en.idea.trim() && content.translations.en.commonMistakes.length > 0 && content.translations.en.annotations.length > 0 && content.translations.en.trace.length > 0, "Incomplete lesson");
    const lines = content.javaExample.split("\n").length;
    for (const step of [...content.translations.en.annotations, ...content.translations.en.trace]) assert(Number.isInteger(step.line) && step.line > 0 && step.line <= lines, "Invalid annotated or trace line");
    assert.deepEqual(content.newerJavaExamples.map(example => example.version), content.translations.en.newerJavaNotes.map(note => note.version), "Unlabeled Newer Java example");
    assert(content.newerJavaExamples.every(example => [10, 14, 15, 16].includes(example.version)), "Invalid Newer Java version");
    prose(content.translations, blocklist);
  }
  let cases = 0;
  for (const entry of manifest.exercises.filter(exercise => exercise.moduleId === moduleId)) {
    const exercise = read<ExerciseContent>(path.join(directory, `${entry.slug}.json`));
    for (const key of Object.keys(entry) as (keyof typeof entry)[]) assert.deepEqual(exercise[key], entry[key], `Manifest mismatch: ${entry.id}.${key}`);
    const privatePack = read<ExercisePrivate>(path.join(directory, "private", `${entry.slug}.json`));
    warnings.push(...validateExerciseContent(exercise, privatePack));
    prose(exercise.translations, blocklist); prose(privatePack.explanations, blocklist);
    if (exercise.kind !== "predict") cases += validateReference(exercise, privatePack);
  }
  const quiz = read<Checkpoint>(path.join(directory, "checkpoint.json"));
  const answers = read<CheckpointPrivate>(path.join(directory, "private", "checkpoint.json"));
  assertPublicContent(quiz); warnings.push(...validateTranslations(quiz));
  assert.equal(quiz.id, courseModule.checkpointId); assert.equal(quiz.moduleId, moduleId); assert.equal(answers.checkpointId, quiz.id);
  assert.equal(quiz.translations.en.questions.length, 5); assert.equal(answers.answers.length, 5);
  assert.equal(new Set(quiz.translations.en.questions.map(question => question.id)).size, 5);
  assert.equal(new Set(answers.answers.map(answer => answer.questionId)).size, 5);
  for (const question of quiz.translations.en.questions) {
    const answer = answers.answers.find(answer => answer.questionId === question.id);
    assert(question.options.length >= 2 && answer?.explanations.en?.trim());
    assert(answer, "Missing checkpoint key");
    assert.equal(new Set(question.options.map(option => option.id)).size, question.options.length, "Duplicate option IDs");
    for (const language of ["en", "fil", "ceb"] as const) {
      const explanation = answer.explanations[language];
      assert(explanation === null || typeof explanation === "string" && explanation.trim(), `Missing checkpoint translation status: ${language}`);
      if (quiz.translations[language] !== null) assert(typeof explanation === "string" && explanation.trim(), `Untranslated checkpoint explanation: ${language}`);
    }
    assert(question.options.some(option => option.id === answer.correctOptionId), "Invalid checkpoint answer");
  }
  prose(quiz.translations, blocklist); prose(answers.answers, blocklist);
  return { moduleId, cases, warnings, passed: true };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = "src/data/foundations.json";
  assert(fs.existsSync(file), "Foundations content is gated: no approved manifest exists. No lessons were generated.");
  const manifest = read<FoundationsManifest>(file);
  validateFoundationsManifest(manifest);
  for (const moduleId of process.argv[2] ? [process.argv[2]] : manifest.modules.map(courseModule => courseModule.id)) console.log(JSON.stringify(validateFoundationsModule(manifest, moduleId)));
}
