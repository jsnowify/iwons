import type { FoundationsManifest, Translated } from "./types";
import { lessonLanguages } from "./types.ts";
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const positive = (value: unknown) => Number.isInteger(value) && Number(value) > 0;
function unique(values: string[], label: string) { check(new Set(values).size === values.length, `Duplicate ${label}`); }

export function validateFoundationsManifest(value: unknown, complete = true): asserts value is FoundationsManifest {
  check(object(value) && value.schemaVersion === 1, "Invalid Foundations manifest version");
  for (const key of ["courses", "modules", "lessons", "exercises"]) check(Array.isArray(value[key]) && value[key].every(object), `Missing ${key}`);
  const manifest = value as unknown as FoundationsManifest;
  const all = [...manifest.courses, ...manifest.modules, ...manifest.lessons, ...manifest.exercises];
  for (const entry of all) {
    check(text(entry.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), "Invalid ID or slug");
    check(positive(entry.order), `Invalid order: ${entry.id}`);
  }
  unique(all.map(entry => entry.id), "IDs");
  unique([...manifest.modules, ...manifest.lessons, ...manifest.exercises].map(entry => entry.slug), "slugs");
  for (const entry of [...manifest.courses, ...manifest.modules, ...manifest.lessons]) {
    check(strings(entry.languages) && entry.languages.includes("en") && entry.languages.every(language => lessonLanguages.includes(language)), `Invalid languages: ${entry.id}`);
    unique(entry.languages, "languages");
  }
  unique(manifest.courses.map(course => String(course.order)), "course order");
  if (complete) check(manifest.courses.length === 2 && manifest.courses.some(course => course.id === "cp1") && manifest.courses.some(course => course.id === "cp2"), "Expected CP1 and CP2");
  const modules = new Map(manifest.modules.map(courseModule => [courseModule.id, courseModule]));
  const lessonPositions = new Map<string, number>();
  const introduced = new Map<string, number>();
  let position = 0;
  for (const course of [...manifest.courses].sort((a, b) => a.order - b.order)) {
    check(["cp1", "cp2"].includes(course.id) && course.slug === course.id && strings(course.moduleIds) && strings(course.prerequisites), `Invalid course: ${course.id}`);
    for (const prerequisite of course.prerequisites) check(manifest.courses.some(other => other.id === prerequisite && other.order < course.order), `Invalid prerequisite: ${course.id}`);
    unique(course.moduleIds, "course module IDs");
    const children = manifest.modules.filter(courseModule => courseModule.courseId === course.id);
    check(children.length === course.moduleIds.length && children.every(courseModule => course.moduleIds.includes(courseModule.id)), `Course membership mismatch: ${course.id}`);
    if (complete) check(children.length === 12, `${course.id}: expected 12 modules`);
    unique(children.map(courseModule => String(courseModule.order)), "module order");
    for (const courseModule of children.sort((a, b) => a.order - b.order)) {
      check(strings(courseModule.lessonIds) && strings(courseModule.exerciseIds) && text(courseModule.checkpointId) && typeof courseModule.capstone === "boolean", `Incomplete module: ${courseModule.id}`);
      unique(courseModule.lessonIds, "module lesson IDs"); unique(courseModule.exerciseIds, "module exercise IDs");
      const lessons = manifest.lessons.filter(lesson => lesson.moduleId === courseModule.id);
      const exercises = manifest.exercises.filter(exercise => exercise.moduleId === courseModule.id);
      check(lessons.length === courseModule.lessonIds.length && lessons.every(lesson => courseModule.lessonIds.includes(lesson.id)), `Lesson membership mismatch: ${courseModule.id}`);
      check(exercises.length === courseModule.exerciseIds.length && exercises.every(exercise => courseModule.exerciseIds.includes(exercise.id)), `Exercise membership mismatch: ${courseModule.id}`);
      if (complete) check(lessons.length >= 3 && lessons.length <= 6, `${courseModule.id}: expected 3–6 lessons`);
      unique(lessons.map(lesson => String(lesson.order)), "lesson order"); unique(exercises.map(exercise => String(exercise.order)), "exercise order");
      for (const lesson of lessons.sort((a, b) => a.order - b.order)) {
        position++;
        lessonPositions.set(lesson.id, position);
        check(object(lesson.introducedIn), `Missing introducedIn: ${lesson.id}`);
        for (const [concept, lessonId] of Object.entries(lesson.introducedIn)) {
          check(text(concept) && lessonId === lesson.id && !introduced.has(concept), `Invalid or duplicate concept introduction: ${concept}`);
          introduced.set(concept, position);
        }
      }
    }
  }
  check(manifest.modules.every(courseModule => manifest.courses.some(course => course.id === courseModule.courseId)), "Orphan module");
  check(manifest.lessons.every(lesson => modules.has(lesson.moduleId)), "Orphan lesson");
  unique(manifest.modules.map(courseModule => courseModule.checkpointId), "checkpoint IDs");
  for (const exercise of manifest.exercises) {
    const courseModule = modules.get(exercise.moduleId);
    check(courseModule && courseModule.exerciseIds.includes(exercise.id), `Orphan exercise: ${exercise.id}`);
    check(["predict", "fix", "fill", "code", "program", "project"].includes(exercise.kind), `Invalid kind: ${exercise.id}`);
    check(["function", "program"].includes(exercise.ioMode) && exercise.javaMinVersion === 8, `Invalid Java baseline: ${exercise.id}`);
    check(["easy", "medium", "hard"].includes(exercise.difficulty) && text(exercise.task) && positive(exercise.xp), `Incomplete exercise: ${exercise.id}`);
    check(exercise.kind !== "project" || courseModule.capstone, `Project outside capstone: ${exercise.id}`);
    check(strings(exercise.concepts) && exercise.concepts.length > 0, `Missing concepts: ${exercise.id}`);
    unique(exercise.concepts, "exercise concepts");
    const after = lessonPositions.get(exercise.afterLessonId);
    check(after && courseModule.lessonIds.includes(exercise.afterLessonId), `Invalid exercise lesson: ${exercise.id}`);
    for (const concept of exercise.concepts) check(introduced.has(concept) && introduced.get(concept)! <= after, `${exercise.id}: concept used before introduction: ${concept}`);
  }
}

function structure(source: unknown, target: unknown, path: string) {
  if (Array.isArray(source)) {
    check(Array.isArray(target) && target.length === source.length, `Translation array mismatch: ${path}`);
    source.forEach((item, index) => structure(item, target[index], `${path}[${index}]`));
  } else if (object(source)) {
    check(object(target) && JSON.stringify(Object.keys(source).sort()) === JSON.stringify(Object.keys(target).sort()), `Translation fields mismatch: ${path}`);
    for (const key of Object.keys(source)) {
      check(!["code", "starterCode", "referenceSolution", "correctOptionId", "correctAnswer", "expected"].includes(key), `Code or private answer in translation: ${path}.${key}`);
      if (["id", "line", "version", "variables"].includes(key)) check(JSON.stringify(source[key]) === JSON.stringify(target[key]), `Translated identifier or trace value: ${path}.${key}`);
      else structure(source[key], target[key], `${path}.${key}`);
    }
  } else check(typeof source === typeof target && (typeof target !== "string" || text(target)), `Invalid translated value: ${path}`);
}
export function validateTranslations(value: unknown): string[] {
  check(object(value) && object(value.translations) && object(value.translationStatus), "Missing translations or statuses");
  const source = value as unknown as Translated<unknown>;
  check(Object.keys(source.translations).sort().join(",") === "ceb,en,fil" && Object.keys(source.translationStatus).sort().join(",") === "ceb,en,fil", "Expected exactly en, fil and ceb translation slots");
  check(object(source.translations.en), "English source is required");
  const warnings: string[] = [];
  for (const language of lessonLanguages) {
    check(["draft", "reviewed"].includes(source.translationStatus[language]), `Invalid translation status: ${language}`);
    const copy = source.translations[language];
    check(copy !== undefined, `Translation must exist or be explicitly null: ${language}`);
    if (copy === null) { check(language !== "en" && source.translationStatus[language] === "draft", `Missing translation marked reviewed: ${language}`); continue; }
    structure(source.translations.en, copy, language);
    if (language !== "en") {
      check(JSON.stringify(copy) !== JSON.stringify(source.translations.en), `Translation identical to English: ${language}`);
      const english = JSON.stringify(source.translations.en).match(/[A-Z][A-Za-z ,'-]{30,}[.!?]/g) ?? [];
      if (english.some(sentence => JSON.stringify(copy).includes(sentence))) warnings.push(`${language}: possible untranslated English sentence; native-speaker review required`);
    }
  }
  return warnings;
}

// A lexical precheck; javac --release 8 remains the authoritative validator.
export function validateJava8Source(source: string) {
  let code = "", index = 0;
  while (index < source.length) {
    if (source.startsWith("//", index)) { while (index < source.length && source[index] !== "\n") index++; }
    else if (source.startsWith("/*", index)) { const end = source.indexOf("*/", index + 2); check(end >= 0, "Unclosed Java comment"); index = end + 2; }
    else if (source.startsWith('"""', index)) throw new Error("Text blocks require newer Java");
    else if (source[index] === '"' || source[index] === "'") { const quote = source[index++]; while (index < source.length) { if (source[index] === "\\") index += 2; else if (source[index++] === quote) break; } code += " "; }
    else code += source[index++];
  }
  check(!/\bvar\s+[\w$]+\s*=/.test(code), "var requires newer Java");
  check(!/\brecord\s+[\w$]+\s*\(/.test(code), "Records require newer Java");
  check(!/\b(?:case\b[^:;{}]*|default)\s*->/.test(code) && !/(?:=|return|yield)\s*switch\s*\(/.test(code), "Switch expressions require newer Java");
}
