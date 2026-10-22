import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { lessonDone, lessonSentences, lessonCases, exampleOutputFor, stepKey, type CodeLessonCopy, foundationLessons, foundationModules, foundationOutline, moduleProgress, neighbourLessons, FOUNDATION_TRACK_ID, lessonStatus, readFoundationPractice, lessonFeedback, relatedFoundationLessons } from "@/lib/foundation-track";
import { progressPatch, mergeProgress } from "@/lib/accounts/contracts";
import { migrateV5Data } from "@/lib/migrations/v6";

describe("Foundation curriculum outline", () => {
  it("lists 60 topics in five modules, 30 code and 30 concept, with unique ids", () => {
    expect(foundationModules.map(module => module.order)).toEqual([1, 2, 3, 4, 5]);
    expect(foundationOutline).toHaveLength(60);
    expect(new Set(foundationOutline.map(entry => entry.id)).size).toBe(60);
    expect(foundationOutline.filter(entry => entry.type === "code")).toHaveLength(30);
    expect(foundationOutline.map(entry => entry.moduleId).filter((id, index, all) => all.indexOf(id) === index)).toEqual(foundationModules.map(module => module.id));
    const sizes = foundationModules.map(module => foundationOutline.filter(entry => entry.moduleId === module.id).length);
    expect(sizes).toEqual([14, 13, 11, 10, 12]);
    expect(foundationOutline[2].id).toBe("variables-constants");
  });
  it("maps every written lesson into exactly one outline slot and keeps neighbours free of prerequisites", () => {
    const mapped = foundationOutline.map(entry => entry.contentId).filter(Boolean);
    expect(new Set(mapped)).toEqual(new Set(foundationLessons.map(lesson => lesson.id)));
    expect(neighbourLessons("variables-constants")).toEqual({ previous: "syntax-semantics", next: "data-types" });
    expect(neighbourLessons("programming-fundamentals").previous).toBeUndefined();
    // Completion recorded under the first six ids, from before the 60-topic curriculum, still counts.
    const steps = { variables: { code: "", completed: true, hintsUsed: 0, attempts: 1 }, "data-types": { code: "", completed: true, hintsUsed: 0, attempts: 1 } };
    expect(lessonDone(steps, "variables-constants")).toBe(true);
    expect(lessonDone(steps, "data-types")).toBe(true);
    expect(lessonDone(steps, "operators")).toBe(false);
    expect(moduleProgress("core-fundamentals", steps)).toMatchObject({ total: 14, done: 2, ready: 14, complete: false });
  });
});
describe("Foundation code lessons with input", () => {
  const code = foundationLessons.filter((item): item is CodeLessonCopy => item.type === "code");
  it("give every language at least one checkable case, and several cases when a program reads input", () => {
    for (const lesson of code) for (const language of ["javascript", "python"] as const) {
      const cases = lessonCases(lesson, language);
      expect(cases.length, lesson.id).toBeGreaterThan(0);
      for (const item of cases) expect(item.expected.length, lesson.id).toBeGreaterThan(0);
      expect(exampleOutputFor(lesson, language).length).toBeGreaterThan(0);
      if (cases.some(item => item.stdin)) expect(cases.length, lesson.id + " needs 2+ inputs so printing a fixed answer fails").toBeGreaterThanOrEqual(2);
    }
    expect(code.map(lesson => lesson.id)).toEqual(foundationOutline.filter(entry => entry.type === "code").map(entry => entry.id));
    expect(code).toHaveLength(30);
  });
  it("names the input that failed and keeps feedback kind", () => {
    const lesson = code.find(item => item.id === "input-output")!;
    const cases = lessonCases(lesson, "javascript");
    const result = { verdict: "wrong_answer" as const, cases: [
      { id: "case-0", passed: true, actual: "Hello, Ada!", expected: "Hello, Ada!", runtimeMs: 1, stdout: "" },
      { id: "case-1", passed: false, actual: "Hello, Iwons!", expected: "Hello, Mia!", runtimeMs: 1, stdout: "" }] };
    const text = lessonFeedback(result, lesson, "javascript", cases);
    expect(text).toContain('For the input "Mia"');
    expect(text).toContain('"Hello, Iwons!"');
    expect(text).toContain('"Hello, Mia!"');
    expect(text).not.toMatch(/wrong/i);
  });
});
describe("related lesson suggestions", () => {
  it("stay plain, few, and relevant: only lessons with topic tags, never more than four, matched on whole words", () => {
    const catalog = JSON.parse(readFileSync("src/data/catalog.json", "utf8")) as { id: string; level: number; topics: string[] }[];
    const tagged = new Set(foundationLessons.filter(lesson => lesson.topics.length > 0).map(lesson => lesson.id));
    let linked = 0;
    for (const problem of catalog) {
      const related = relatedFoundationLessons(problem.topics);
      expect(related.length, problem.id).toBeLessThanOrEqual(4);
      for (const lesson of related) expect(tagged.has(lesson.id), `${problem.id} -> ${lesson.id}`).toBe(true);
      if (related.length) linked++;
    }
    expect(linked).toBeGreaterThan(0);
    expect(relatedFoundationLessons(["Graph breadth-first distances"]).map(item => item.id)).toContain("graphs");
    expect(relatedFoundationLessons(["Linked lists, binary trees and search trees"]).map(item => item.id)).toEqual(expect.arrayContaining(["linked-lists", "trees"]));
    // "Logic" must not match inside "Topological", and "Programming" must not match "dynamic programming".
    expect(relatedFoundationLessons(["Topological queues"]).map(item => item.id)).not.toContain("conditional-statements");
    expect(relatedFoundationLessons(["Greedy choices, dynamic programming and backtracking"])).toEqual([]);
  });
});
describe("optional Foundation content and progress compatibility", () => {
  it("publishes all sixty ordered, self-contained lessons: code lessons in two languages, concept lessons with checks", () => {
    expect(foundationLessons.map(lesson => lesson.id)).toEqual(foundationOutline.map(entry => entry.id));
    expect(foundationLessons.map(lesson => lesson.type)).toEqual(foundationOutline.map(entry => entry.type));
    for (const lesson of foundationLessons) {
      expect(lessonSentences(lesson)).toBeLessThanOrEqual(3);
      const practice = readFoundationPractice(JSON.parse(readFileSync(`public/foundation-lessons/${lesson.id}.json`, "utf8")), lesson.id);
      expect(practice.type).toBe(lesson.type);
      expect(lesson).not.toHaveProperty("check");
      if (lesson.type === "code" && practice.type === "code") {
        for (const language of ["javascript", "python"] as const) {
          const item = practice.languages[language];
          expect(lesson.languages[language].exampleCode.length).toBeGreaterThan(0);
          expect(item.hints).toHaveLength(3);
          expect(item.hints[2]).toContain("This trips up lots of people");
          expect(item.answerCode).not.toBe(item.starterCode);
          expect(lesson.languages[language]).not.toHaveProperty("answerCode");
        }
      }
      if (lesson.type === "concept" && practice.type === "concept") {
        expect(practice.check.length).toBeGreaterThanOrEqual(2);
        expect(practice.check.length).toBeLessThanOrEqual(4);
        for (const question of practice.check) { expect(question.options[question.answer]).toBeTruthy(); expect(question.explanation.length).toBeGreaterThan(20); }
      }
    }
    expect(() => readFoundationPractice({ version: 1 }, "variables")).toThrow();
    expect(() => readFoundationPractice({ version: 2, id: "x", type: "concept", check: [{ prompt: "q", options: ["a", "b"], answer: 5, explanation: "e", hint: "h" }, { prompt: "q", options: ["a", "b"], answer: 0, explanation: "e", hint: "h" }] }, "x")).toThrow();
  });
  it("adds a versioned track without replacing legacy foundation work or challenge solves", () => {
    const old = { "receipt-arithmetic": { completed: true, steps: { first: { code: "old draft", completed: true, attempts: 1, hintsUsed: 1 } } } };
    const data = migrateV5Data({ topicFoundations: old, progress: { challenge: true } });
    expect(data.topicFoundations).toEqual(old);
    expect(data.progress).toEqual({ challenge: true });
    const incoming = progressPatch.parse({ foundationProgress: { [FOUNDATION_TRACK_ID]: { completed: false, steps: {
      variables: { code: "const score = 12;", completed: true, hintsUsed: 0, attempts: 1, updatedAt: 20 },
    } } } });
    const current = { ...progressPatch.parse({ foundationProgress: old }), updatedAt: 1 };
    const merged = mergeProgress(current, incoming);
    expect(merged.foundationProgress["receipt-arithmetic"]).toEqual(current.foundationProgress["receipt-arithmetic"]);
    expect(merged.foundationProgress[FOUNDATION_TRACK_ID].steps.variables.completed).toBe(true);
    expect(merged.unverifiedSolves).toEqual([]);
    const resetPatch = structuredClone(incoming);
    resetPatch.foundationProgress[FOUNDATION_TRACK_ID].steps.variables.completed = false;
    resetPatch.foundationProgress[FOUNDATION_TRACK_ID].steps.variables.code = "reset starter";
    resetPatch.foundationProgress[FOUNDATION_TRACK_ID].steps.variables.updatedAt = 30;
    const reset = mergeProgress(merged, resetPatch);
    expect(reset.foundationProgress[FOUNDATION_TRACK_ID].steps.variables).toMatchObject({ completed: true, code: "reset starter" });
  });
  it("reports concrete output feedback and status without any prerequisite state", () => {
    expect(stepKey("loops", "javascript")).toBe("loops");
    expect(stepKey("loops", "python")).toBe("loops-python");
    expect(lessonStatus()).toBe("Not started");
    const started = { code: "", completed: false, hintsUsed: 0, attempts: 0 };
    expect(lessonStatus(started)).toBe("In progress");
    expect(lessonStatus({ ...started, completed: true })).toBe("Done");
    const lesson = foundationLessons.find((item): item is CodeLessonCopy => item.type === "code")!;
    expect(lessonFeedback({ verdict: "wrong_answer", cases: [] }, lesson)).toContain("console.log");
    expect(lessonFeedback({ verdict: "wrong_answer", cases: [] }, lesson, "python")).toContain("print(...)");
    expect(lessonFeedback({ verdict: "wrong_answer", cases: [{ id: "practice", passed: false, actual: "Hello", expected: lesson.expectedOutput, runtimeMs: 1, stdout: "Hello" }] }, lesson)).toContain('printed "Hello"');
    expect(lessonFeedback({ verdict: "accepted", cases: [] }, lesson)).toBe(lesson.successMessage);
    expect(relatedFoundationLessons(["Variables and expressions"]).map(item => item.id)).toEqual(["variables-constants", "expressions-statements"]);
  });
});
