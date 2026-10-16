import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { validateFoundationsManifest, validateJava8Source, validateTranslations } from "@/lib/foundations/validate";
import { emptyFoundationsProgress, type FoundationsManifest, type ExerciseContent, type ExercisePrivate } from "@/lib/foundations/types";
import { learningUrl, translated } from "@/lib/foundations/translations";
import { foundationsRewards } from "@/lib/foundations/progress";
import { validateFoundationsProgress } from "@/lib/foundations/validate-progress";
import { assertPublicContent, validateExerciseContent, validateReference } from "../../scripts/validate-foundations";

// Synthetic validation fixtures only. These are not publishable course content.
function manifest(): FoundationsManifest {
  return {
    schemaVersion: 1,
    courses: [{ id: "cp1", slug: "cp1", order: 1, prerequisites: [], moduleIds: ["m1"], languages: ["en"] }],
    modules: [{ id: "m1", slug: "fixture-module", courseId: "cp1", order: 1, lessonIds: ["l1", "l2"], exerciseIds: ["e1"], checkpointId: "q1", capstone: false, languages: ["en"] }],
    lessons: [
      { id: "l1", slug: "fixture-first", moduleId: "m1", order: 1, introducedIn: { value: "l1" }, languages: ["en"] },
      { id: "l2", slug: "fixture-second", moduleId: "m1", order: 2, introducedIn: { loop: "l2" }, languages: ["en"] },
    ],
    exercises: [{ id: "e1", slug: "fixture-exercise", moduleId: "m1", order: 1, afterLessonId: "l1", concepts: ["value"], difficulty: "easy", kind: "program", task: "Validation fixture", ioMode: "program", javaMinVersion: 8, xp: 10 }],
  };
}
function translations() {
  return { translations: { en: { title: "Source fixture", options: [{ id: "a", text: "First" }] }, fil: null as null | { title: string; options: { id: string; text: string }[] }, ceb: null }, translationStatus: { en: "reviewed" as const, fil: "draft" as const, ceb: "draft" as const } };
}
function exercise(): ExerciseContent {
  return {
    ...manifest().exercises[0], track: "foundations", starterCode: "public class Main {}", cases: [0, 1, 2].map(index => ({ id: `v${index}`, input: [], stdin: "", expected: "4", boundary: index === 0 })),
    translations: { en: { title: "Fixture", statement: "Synthetic fixture.", hints: ["First hint", "Second hint", "Third hint"], options: [], steps: [] }, fil: null, ceb: null },
    translationStatus: { en: "reviewed", fil: "draft", ceb: "draft" },
  };
}
function privatePack(): ExercisePrivate {
  return { exerciseId: "e1", hiddenCases: [0, 1, 2, 3, 4].map(index => ({ id: `h${index}`, input: [], stdin: "", expected: "4" })), referenceSolution: "public class Main { public static void main(String[] args) { System.out.println(4); } }", explanations: { en: "Fixture explanation.", fil: null, ceb: null } };
}
describe("Foundations structure", () => {
  it("accepts a scoped fixture but rejects it as a complete publishable manifest", () => {
    expect(() => validateFoundationsManifest(manifest(), false)).not.toThrow();
    expect(() => validateFoundationsManifest(manifest())).toThrow("CP1 and CP2");
  });
  it("rejects use of a later or unknown concept", () => {
    for (const concept of ["loop", "unknown"]) { const value = manifest(); value.exercises[0].concepts = [concept]; expect(() => validateFoundationsManifest(value, false)).toThrow("before introduction"); }
  });
  it("rejects duplicate introductions, slugs and orphan exercises", () => {
    const introductions = manifest(); introductions.lessons[1].introducedIn = { value: "l2" };
    expect(() => validateFoundationsManifest(introductions, false)).toThrow("introduction");
    const slugs = manifest(); slugs.lessons[1].slug = slugs.lessons[0].slug;
    expect(() => validateFoundationsManifest(slugs, false)).toThrow("slugs");
    const orphan = manifest(); orphan.exercises[0].moduleId = "missing";
    expect(() => validateFoundationsManifest(orphan, false)).toThrow();
  });
  it("keeps projects inside capstones", () => {
    const value = manifest(); value.exercises[0].kind = "project";
    expect(() => validateFoundationsManifest(value, false)).toThrow("capstone");
  });
});
describe("translations and privacy", () => {
  it("falls back to English for an explicitly missing translation", () => {
    const value = translations(); expect(validateTranslations(value)).toEqual([]);
    expect(translated(value, "ceb")).toMatchObject({ content: value.translations.en, language: "en", missing: true });
    expect(learningUrl("fil", "cp1", "meet-java")).toBe("/tl/learn/cp1/meet-java/");
    expect(learningUrl("en")).toBe("/learn/"); expect(learningUrl("ceb")).toBe("/ceb/learn/");
  });
  it("rejects unchanged English translations and changed option identifiers", () => {
    const value = translations(); value.translations.fil = structuredClone(value.translations.en);
    expect(() => validateTranslations(value)).toThrow("identical");
    value.translations.fil.title = "Pamagat"; value.translations.fil.options[0].id = "b";
    expect(() => validateTranslations(value)).toThrow("identifier");
  });
  it("rejects missing fields and translated trace values", () => {
    const value = { translations: { en: { trace: [{ line: 1, variables: { count: "2" }, explanation: "A value." }] }, fil: { trace: [{ line: 1, variables: { count: "3" }, explanation: "Isang value." }] }, ceb: null }, translationStatus: { en: "reviewed", fil: "draft", ceb: "draft" } };
    expect(() => validateTranslations(value)).toThrow("trace value");
    expect(() => validateTranslations({ translations: { en: {} }, translationStatus: {} })).toThrow();
  });
  it("blocks answer and hidden-test leaks at any nesting level", () => {
    for (const key of ["hiddenCases", "referenceSolution", "correctOptionId", "answers"]) expect(() => assertPublicContent({ nested: [{ [key]: "secret" }] })).toThrow("Private field");
  });
});
describe("Java validation", () => {
  it.each(['var n = 1;', 'record Item(int n) {}', 'String s = """hello""";', 'int n = switch (x) { case 1 -> 2; default -> 0; };'])("rejects required newer-Java syntax: %s", code => expect(() => validateJava8Source(code)).toThrow());
  it("allows Java 8 lambdas and modern words inside comments or strings", () => {
    expect(() => validateJava8Source('/* var n = 1; */ String note = "record Item(int n) {}"; list.forEach(n -> System.out.println(n));')).not.toThrow();
  });
  it("checks hints, visible/hidden cases, boundary metadata and private explanations", () => {
    expect(() => validateExerciseContent(exercise(), privatePack())).not.toThrow();
    const fewer = privatePack(); fewer.hiddenCases.pop(); expect(() => validateExerciseContent(exercise(), fewer)).toThrow("hidden");
    const hints = exercise(); hints.translations.en.hints[1] = hints.translations.en.hints[0]; expect(() => validateExerciseContent(hints, privatePack())).toThrow();
  });
  const hasJava = spawnSync("javac", ["-version"], { encoding: "utf8" }).status === 0;
  it.skipIf(!hasJava)("compiles with --release 8 and executes all eight native fixture cases", () => {
    expect(validateReference(exercise(), privatePack())).toBe(8);
  }, 30000);
  it.skipIf(!hasJava)("rejects Java 9 APIs even when the local JDK supports them", () => {
    const pack = privatePack(); pack.referenceSolution = "public class Main { public static void main(String[] args) { System.out.println(java.util.List.of(4)); } }";
    expect(() => validateReference(exercise(), pack)).toThrow("Java 8 compilation failed");
  }, 30000);
  it.skipIf(!hasJava)("validates Java 8 function references through the preserved harness", () => {
    const value = exercise(), pack = privatePack(); value.ioMode = "function"; value.functionName = "doubleValue"; value.javaParams = ["int"];
    const cases = Array.from({ length: 8 }, (_, index) => ({ id: `case-${index}`, input: [index], expected: index * 2, boundary: index === 0 }));
    value.cases = cases.slice(0, 3); pack.hiddenCases = cases.slice(3);
    pack.referenceSolution = "public class Solution { public int doubleValue(int value) { return value * 2; } }";
    expect(validateReference(value, pack)).toBe(8);
  }, 30000);
});
it("computes Foundations rewards without changing Path progress or counting unknown solves", () => {
  const data = manifest(), progress = emptyFoundationsProgress();
  progress.exercisesSolved = { e1: true, unknown: true }; progress.lessonsRead = { l1: true, l2: true };
  expect(foundationsRewards(data, progress)).toEqual({ xp: 10, moduleStamps: [], courseStamps: [] });
  progress.checkpointScores.q1 = { correct: 4, total: 5, at: 1 };
  expect(foundationsRewards(data, progress)).toEqual({ xp: 10, moduleStamps: ["m1"], courseStamps: ["cp1"] });
  expect(() => validateFoundationsProgress(progress)).not.toThrow();
  expect(() => validateFoundationsProgress({ ...progress, checkpointScores: { q1: { correct: 6, total: 5, at: 1 } } })).toThrow();
});
