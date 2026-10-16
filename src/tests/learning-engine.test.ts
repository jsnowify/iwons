import { describe, expect, it } from "vitest";
import { calibration, conceptMastery, dailyShuffle, emptyLearningState, rateRecall, recallKey, suggestedRung, validateLearningState, type LearningAttempt, type RecallState } from "@/lib/foundations/learning-state";
import { migrateV5Data } from "@/lib/migrations/v6";
import { courseNamingErrors } from "@/lib/foundations/naming";

const card: RecallState = { cardId: "first-message", course: "cp1", track: "python", concept: "output", step: 0, due: 0, successes: 0, misses: 0 };
const attempt: LearningAttempt = { exerciseId: "receipt", course: "cp1", track: "python", concept: "output", rung: "write", at: 100, correct: false, clean: false, hints: 0, confidence: 3, durationMs: 1000 };
describe("local learning engine", () => {
  it("extends recall intervals, retries a miss and prevents a miss from earning Easy", () => {
    const missed = rateRecall(card, "Easy", false, 100);
    expect(missed.due).toBe(600100); expect(missed.step).toBe(0); expect(missed.misses).toBe(1);
    const good = rateRecall(card, "Good", true, 100);
    expect(rateRecall(good, "Good", true, 100).due).toBeGreaterThan(good.due);
    expect(card.successes).toBe(0);
  });
  it("isolates mastery by track and concept and uses recent outcomes", () => {
    const state = emptyLearningState(); state.attempts = [{ ...attempt, correct: true, clean: true }];
    expect(conceptMastery(state, "cp1", "python", "output")).toBe(100);
    expect(conceptMastery(state, "cp1", "java", "output")).toBe(0);
    state.attempts.push(attempt); expect(conceptMastery(state, "cp1", "python", "output")).toBe(50);
  });
  it("offers scaffolding rather than forcing it and calibrates confidence with outcomes", () => {
    const state = emptyLearningState(); state.attempts = [attempt, { ...attempt, at: 200 }];
    expect(suggestedRung(state, "python", "output")?.rung).toBe("parsons");
    expect(suggestedRung(state, "java", "output")).toBeNull();
    expect(calibration(state, "cp1", "python")[2]).toEqual({ confidence: 3, attempts: 2, correct: 0 });
  });
  it("shuffles reproducibly without mutating input and retains every item", () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ id: String(index) }));
    const copy = structuredClone(items);
    expect(dailyShuffle(items, "2026-10-16", "java")).toEqual(dailyShuffle(items, "2026-10-16", "java"));
    expect(new Set(dailyShuffle(items, "2026-10-16", "java").map(item => item.id)).size).toBe(12);
    expect(items).toEqual(copy);
  });
  it("rejects malformed state and keys before data can be imported", () => {
    const state = emptyLearningState(); expect(() => validateLearningState(state)).not.toThrow();
    state.recalls[recallKey("cp1", "python", "output", card.cardId)] = card;
    expect(() => validateLearningState(state)).not.toThrow();
    expect(() => validateLearningState({ ...state, attempts: [{ ...attempt, durationMs: -1 }] })).toThrow();
    expect(() => validateLearningState({ ...state, attempts: [{ ...attempt, confidence: "3" }] })).toThrow();
    expect(() => validateLearningState({ ...state, attempts: [{ ...attempt, course: ["cp1"] }] })).toThrow();
    expect(() => validateLearningState({ ...state, recalls: { wrong: card } })).toThrow();
  });
  it("migrates without modifying old progress, notes, drafts or the input object", () => {
    const data = { notes: { lesson: "my explanation" }, progress: { p: true }, schemaVersion: 5, "drafts:p:java": "class Solution {}" };
    const before = structuredClone(data); const migrated = migrateV5Data(data);
    expect(data).toEqual(before); expect(migrated).toMatchObject({ ...data, schemaVersion: 6, learning: emptyLearningState() });
  });
  it("rejects abbreviations in learner prose, with the defined algorithm exception", () => {
    expect(courseNamingErrors("Start CP1")).not.toEqual([]);
    expect(courseNamingErrors("Start DSA")).not.toEqual([]);
    expect(courseNamingErrors("Data Structures and Algorithms: later called DSA.")).toEqual([]);
    expect(courseNamingErrors("Computer Programming 1")).toEqual([]);
  });
});
