import { describe, it, expect, beforeEach, vi } from "vitest";
import { compare } from "@/lib/harness/compare";
import { summarize } from "@/lib/watch/score";
import { rateReview } from "@/lib/srs";
import { storage } from "@/lib/storage";
import { validateProblem } from "@/lib/validate-problem";
import type { IntegrityEvent } from "@/lib/types";
class MemoryStorage {
  [key: string]: unknown;
  getItem(k: string) {
    return Object.hasOwn(this, k) ? (this[k] as string) : null;
  }
  setItem(k: string, v: string) {
    this[k] = v;
  }
  removeItem(k: string) {
    delete this[k];
  }
}
beforeEach(() => {
  vi.stubGlobal("window", {
    localStorage: new MemoryStorage(),
    dispatchEvent: vi.fn(),
  });
});
describe("result comparison", () => {
  it("compares objects independent of key order", () =>
    expect(compare({ b: 2, a: [1, null] }, { a: [1, null], b: 2 })).toBe(true));
  it("keeps ordered arrays ordered", () =>
    expect(compare([2, 1], [1, 2])).toBe(false));
  it("matches unordered nested collections with duplicate accounting", () => {
    expect(compare([[2, 1], [3]], [[3], [1, 2]], { unordered: true })).toBe(
      true,
    );
    expect(compare([1, 1], [1, 2], { unordered: true })).toBe(false);
  });
  it("allows explicit floating point tolerance", () => {
    expect(compare(0.1 + 0.2, 0.3, { floatTolerance: 1e-8 })).toBe(true);
    expect(compare(0.31, 0.3, { floatTolerance: 0.001 })).toBe(false);
  });
  it("distinguishes missing properties from null", () =>
    expect(compare({}, { x: null })).toBe(false));
});
describe("Iwons Watch scoring", () => {
  it("starts clean and never penalizes low-reliability hints", () =>
    expect(summarize([{ t: 0, type: "devtools_hint" }]).score).toBe(100));
  it("penalizes only significant away events and does not double-count blur", () => {
    const e: IntegrityEvent[] = [
      { t: 0, type: "tab_hidden" },
      { t: 0, type: "window_blur" },
      { t: 6000, type: "tab_visible", durationMs: 6000 },
      { t: 6000, type: "window_focus" },
    ];
    expect(summarize(e)).toMatchObject({
      score: 97,
      tabSwitches: 1,
      totalAwayMs: 6000,
    });
  });
  it("scores large pastes and multiline pastes", () =>
    expect(
      summarize([
        { t: 1, type: "paste", meta: { chars: 300, lines: 1 } },
        { t: 2, type: "paste", meta: { chars: 20, lines: 9 } },
      ]),
    ).toMatchObject({ score: 70, pastes: 2, largestPasteChars: 300 }));
  it("counts fullscreen exits only in contest mode", () => {
    const e: IntegrityEvent[] = [{ t: 0, type: "fullscreen_exit" }];
    expect(summarize(e).score).toBe(100);
    expect(summarize(e, true).score).toBe(90);
  });
  it("caps deductions and score at zero", () => {
    const e: IntegrityEvent[] = Array.from({ length: 30 }, () => [
      { t: 0, type: "tab_visible" as const, durationMs: 90000 },
      { t: 0, type: "paste" as const, meta: { chars: 1000 } },
      { t: 0, type: "fullscreen_exit" as const },
      { t: 0, type: "typing_burst" as const },
    ]).flat();
    expect(summarize(e, true).score).toBe(0);
  });
});
describe("local data", () => {
  it("round-trips drafts, notes, and custom collections without other site data", () => {
    window.localStorage.setItem("other-app", "private");
    storage.write("notes", { p: "my approach" });
    storage.write("drafts:001:python", "def twoSum(): pass");
    storage.write("lists", []);
    const backup = storage.export();
    storage.clear();
    storage.import(backup);
    expect(storage.read("notes", {})).toEqual({ p: "my approach" });
    expect(storage.read("drafts:001:python", "")).toContain("twoSum");
    expect(window.localStorage.getItem("other-app")).toBe("private");
  });
  it("rejects invalid backups before touching existing data", () => {
    storage.write("notes", { keep: "yes" });
    expect(() =>
      storage.import('{"app":"other","schemaVersion":1,"data":{}}'),
    ).toThrow();
    expect(() =>
      storage.import(
        '{"app":"Iwons","schemaVersion":1,"data":{"submissions":{}}}',
      ),
    ).toThrow();
    expect(storage.read("notes", {})).toEqual({ keep: "yes" });
  });
  it("survives corrupt JSON", () => {
    window.localStorage.setItem("iwons:v1:settings", "{broken");
    expect(storage.read("settings", { theme: "dark" })).toEqual({
      theme: "dark",
    });
  });
  it("reports quota failure without throwing", () => {
    window.localStorage.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
    expect(storage.write("notes", {})).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
describe("review scheduling", () => {
  it("resets Again and advances Easy through documented intervals", () => {
    const r = { problemId: "001", step: 1, due: 0 };
    expect(rateReview(r, "Again", 0)).toMatchObject({ step: 0, due: 86400000 });
    expect(rateReview(r, "Easy", 0)).toMatchObject({
      step: 3,
      due: 14 * 86400000,
    });
    expect(rateReview({ ...r, step: 4 }, "Good", 0)).toMatchObject({
      step: 4,
      due: 30 * 86400000,
    });
  });
});
describe("problem authoring", () => {
  it("rejects missing signatures and malformed cases", () => {
    expect(() => validateProblem({ title: "x" })).toThrow();
  });
});
