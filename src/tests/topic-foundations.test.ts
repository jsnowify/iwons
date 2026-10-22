import { describe, it, expect, beforeEach, vi } from "vitest";
import { foundationComplete, foundationFeedback, validateTopicFoundations, type FoundationStep } from "@/lib/topic-foundations";
import { storage } from "@/lib/storage";

const progress = { code: "function practice(){return 6;}", completed: true, hintsUsed: 2, attempts: 3 };
class MemoryStorage {
  [key: string]: unknown;
  getItem(k: string): string | null { return Object.hasOwn(this, k) ? this[k] as string : null; }
  setItem(k: string, v: string) { this[k] = v; }
  removeItem(k: string) { delete this[k]; }
}
beforeEach(() => {
  vi.stubGlobal("window", { localStorage: new MemoryStorage(), dispatchEvent: vi.fn() });
});
describe("topic foundation progress", () => {
  it("requires every step, independently for each topic", () => {
    const steps = [{ id: "a" }, { id: "b" }] as FoundationStep[];
    expect(foundationComplete(steps, { a: progress })).toBe(false);
    expect(foundationComplete(steps, { a: progress, b: progress })).toBe(true);
    expect(foundationComplete([], {})).toBe(false);
  });
  it("adds progress to v6 backups without changing existing challenge work", () => {
    storage.import(JSON.stringify({ app: "Iwons", schemaVersion: 6, data: { progress: { "path3-001": true } } }));
    expect(storage.read("topicFoundations", {})).toEqual({});
    const topicFoundations = { "receipt-arithmetic": { steps: { sum: progress }, completed: false } };
    storage.write("topicFoundations", topicFoundations);
    const backup = storage.export();
    storage.clear(); storage.import(backup);
    expect(storage.read("topicFoundations", {})).toEqual(topicFoundations);
    expect(storage.read("progress", {})).toEqual({ "path3-001": true });
  });
  it("rejects corrupt lesson data before replacing saved work", () => {
    storage.migrate(); storage.write("progress", { original: true });
    for (const bad of [null, [], { a: { completed: true, steps: { a: { ...progress, hintsUsed: 4 } } } }, { a: { completed: true, steps: { a: { ...progress, attempts: -1 } } } }]) {
      expect(() => validateTopicFoundations(bad)).toThrow();
      expect(() => storage.import(JSON.stringify({ app: "Iwons", schemaVersion: 6, data: { topicFoundations: bad } }))).toThrow();
      expect(storage.read("progress", {})).toEqual({ original: true });
    }
  });
  it("explains mistakes using the actual input, expected value, and returned value", () => {
    const step = { validate: [{ id: "a", input: [4], expected: 11 }], mistakeMessages: [{ pattern: "___", message: "Fill the blank." }] } as FoundationStep;
    expect(foundationFeedback({ verdict: "compile_error", cases: [], compileError: { message: "___ is not defined" } }, step)).toBe("Fill the blank.");
    const message = foundationFeedback({ verdict: "wrong_answer", cases: [{ id: "a", passed: false, expected: 11, actual: 7, stdout: "", runtimeMs: 0 }] }, step);
    expect(message).toContain("[4]"); expect(message).toContain("7"); expect(message).toContain("11");
  });
});
