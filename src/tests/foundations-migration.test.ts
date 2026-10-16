import { beforeEach, expect, it, vi } from "vitest";
import { storage } from "@/lib/storage";
import { emptyFoundationsProgress } from "@/lib/foundations/types";
class MemoryStorage {
  [key: string]: unknown;
  getItem(key: string) { return Object.hasOwn(this, key) ? String(this[key]) : null; }
  setItem(key: string, value: string) { this[key] = value; }
  removeItem(key: string) { delete this[key]; }
}
const pathWork = {
  schemaVersion: 3,
  profile: { name: "Josh", avatar: "J", onboarded: true },
  settings: { theme: "dark", language: "typescript", fontSize: 16, tabSize: 4, taglish: true, freeBrowse: true },
  progress: { "path3-001": true }, notes: { "path3-001": "My explanation" },
  "drafts:path3-001:java": "class Solution {}", lists: [{ id: "mine", name: "Keep", problemIds: ["path3-001"] }],
  submissions: [], srs: [{ problemId: "path3-001", step: 1, due: 100 }],
  sessions: { lastProblem: "path3-001" }, plans: { study: 3 }, achievements: ["first-solve"],
};
beforeEach(() => { vi.stubGlobal("window", { localStorage: new MemoryStorage(), dispatchEvent: vi.fn() }); });
function seed() { for (const [key, value] of Object.entries(pathWork)) window.localStorage.setItem(`iwons:v3:${key}`, JSON.stringify(value)); }
it("copies active v3 data without resetting Path records or removing original keys", () => {
  seed(); expect(storage.migrate()).toBe(true);
  for (const [key, value] of Object.entries(pathWork)) {
    expect(window.localStorage.getItem(`iwons:v3:${key}`)).toBe(JSON.stringify(value));
    if (!["settings", "schemaVersion"].includes(key)) expect(storage.read(key, null)).toEqual(value);
  }
  expect(storage.read("settings", {})).toEqual({ ...pathWork.settings, lessonLanguage: "en" });
  expect(storage.read("foundations", null)).toEqual(emptyFoundationsProgress());
  expect(storage.migrate()).toBe(true);
});
it("round-trips v4 lessons, scores, drafts and language together with Path data", () => {
  seed(); storage.migrate();
  const progress = { lessonsRead: { l1: true }, exercisesSolved: { e1: true }, checkpointScores: { q1: { correct: 4, total: 5, at: 100 } } };
  storage.write("foundations", progress); storage.write("settings", { ...pathWork.settings, lessonLanguage: "ceb" });
  const backup = storage.export(); expect(JSON.parse(backup).schemaVersion).toBe(4);
  storage.clear(); storage.import(backup);
  expect(storage.read("foundations", null)).toEqual(progress);
  expect(storage.read("settings", {})).toMatchObject({ lessonLanguage: "ceb" });
  expect(storage.read("progress", {})).toEqual(pathWork.progress);
  expect(storage.read("drafts:path3-001:java", "")).toBe(pathWork["drafts:path3-001:java"]);
});
it("imports a v3 backup without applying the old Path-retirement migration", () => {
  storage.import(JSON.stringify({ app: "Iwons", schemaVersion: 3, data: pathWork }));
  expect(storage.read("progress", {})).toEqual(pathWork.progress);
  expect(storage.read("notes", {})).toEqual(pathWork.notes);
  expect(storage.readArchive()).toBeNull();
});
it("rolls back failed migration and leaves every v3 value intact", () => {
  seed(); const original = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = (key, value) => { if (key === "iwons:v4:notes") throw new DOMException("Full", "QuotaExceededError"); original(key, value); };
  expect(storage.migrate()).toBe(false); expect(storage.keys()).toEqual([]);
  expect(JSON.parse(storage.export()).schemaVersion).toBe(3);
  for (const [key, value] of Object.entries(pathWork)) expect(window.localStorage.getItem(`iwons:v3:${key}`)).toBe(JSON.stringify(value));
});
it("rejects malformed Foundations backups before changing active data", () => {
  seed(); storage.migrate(); const before = storage.export();
  for (const foundations of [{}, { ...emptyFoundationsProgress(), lessonsRead: { a: "yes" } }, { ...emptyFoundationsProgress(), checkpointScores: { q1: { correct: 7, total: 5, at: 1 } } }]) {
    expect(() => storage.import(JSON.stringify({ app: "Iwons", schemaVersion: 4, data: { foundations } }))).toThrow();
  }
  expect(JSON.parse(storage.export()).data).toEqual(JSON.parse(before).data);
  expect(() => storage.import(JSON.stringify({ app: "Iwons", schemaVersion: 4, data: { settings: { ...pathWork.settings, lessonLanguage: "unknown" } } }))).toThrow("lesson language");
});
