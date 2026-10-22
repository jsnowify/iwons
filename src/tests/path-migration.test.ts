import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "@/lib/storage";
import { isLevelUnlocked } from "@/lib/path";
import { problems } from "@/lib/catalog";

class MemoryStorage {
  [key: string]: unknown;
  getItem(key: string) {
    return Object.hasOwn(this, key) ? String(this[key]) : null;
  }
  setItem(key: string, value: string) {
    this[key] = value;
  }
  removeItem(key: string) {
    delete this[key];
  }
}
const original = {
  profile: { name: "Josh", avatar: "J", onboarded: true },
  notes: { "001": "Keep my original explanation." },
  progress: { "001": true },
  "drafts:001:javascript": "function oldWork(){ return 7; }",
  submissions: [
    {
      id: "attempt-1",
      problemId: "001",
      code: "old code",
      at: 1,
      language: "javascript",
      verdict: "accepted",
      results: [],
      integrity: { score: 100, events: [] },
    },
  ],
  lists: [{ id: "list-1", name: "My collection", problemIds: ["001"] }],
};
beforeEach(() => {
  vi.stubGlobal("window", {
    localStorage: new MemoryStorage(),
    dispatchEvent: vi.fn(),
  });
});
describe("v1 work survives the Path release", () => {
  it("archives original records, keeps the profile, and starts new seed progress fresh", () => {
    for (const [key, value] of Object.entries(original))
      window.localStorage.setItem("iwons:v1:" + key, JSON.stringify(value));
    expect(storage.migrate()).toBe(true);
    expect(storage.read("profile", null)).toEqual(original.profile);
    expect(storage.read("progress", {})).toEqual({});
    expect(storage.read("submissions", [])).toEqual([]);
    expect(storage.readArchive()?.data).toMatchObject(original);
    expect(
      window.localStorage.getItem("iwons:v1:drafts:001:javascript"),
    ).toContain("oldWork");
    const exported = storage.export();
    expect(JSON.parse(exported).schemaVersion).toBe(6);
    storage.clear();
    storage.import(exported);
    expect(storage.readArchive()?.data).toMatchObject(original);
    expect(storage.migrate()).toBe(true);
    expect(storage.readArchive()?.data).toMatchObject(original);
  });
  it("imports an original v1 backup into a portable archive", () => {
    storage.import(
      JSON.stringify({ app: "Iwons", schemaVersion: 1, data: original }),
    );
    expect(storage.read("profile", null)).toEqual(original.profile);
    expect(storage.readArchive()?.data).toEqual(original);
    expect(storage.read("notes", {})).toEqual({});
  });
  it("leaves every original key intact when migration runs out of space", () => {
    window.localStorage.setItem(
      "iwons:v1:notes",
      JSON.stringify(original.notes),
    );
    const real = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = (key, value) => {
      if (key === "iwons:v6:notes")
        throw new DOMException("Full", "QuotaExceededError");
      real(key, value);
    };
    expect(storage.migrate()).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("iwons:v1:notes")!)).toEqual(
      original.notes,
    );
    expect(storage.keys()).toEqual([]);
    expect(JSON.parse(storage.export()).data.notes).toEqual(original.notes);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});
describe("unrestricted chapter access", () => {
  it("opens every chapter regardless of earlier solves or the legacy free-browse preference", () => {
    for (let level = 0; level <= 8; level++) {
      expect(isLevelUnlocked(level, {})).toBe(true);
      expect(isLevelUnlocked(level, {}, false)).toBe(true);
      expect(isLevelUnlocked(level, {}, true)).toBe(true);
      expect(isLevelUnlocked(level, { [problems[0].id]: true })).toBe(true);
    }
  });
});
it("round-trips the optional track beside legacy lessons, challenge progress, and drafts", () => {
  storage.migrate();
  const legacy = { completed: true, steps: { first: { code: "old lesson", completed: true, hintsUsed: 1, attempts: 2 } } };
  const track = { completed: false, steps: { variables: { code: "const score = 12;", completed: true, hintsUsed: 3, attempts: 1 } } };
  storage.write("topicFoundations", { "receipt-arithmetic": legacy, "foundation-track-v1": track });
  storage.write("progress", { challenge: true });
  storage.write("drafts:challenge:javascript", "challenge draft");
  const backup = storage.export();
  expect(JSON.parse(backup).schemaVersion).toBe(6);
  storage.clear(); storage.import(backup);
  expect(storage.read("topicFoundations", {})).toEqual({ "receipt-arithmetic": legacy, "foundation-track-v1": track });
  expect(storage.read("progress", {})).toEqual({ challenge: true });
  expect(storage.read("drafts:challenge:javascript", "")).toBe("challenge draft");
});
it("preserves both earlier editions through v2 migration and a portable v3 round trip", () => {
  const previous = { ...original, notes: { "iwons-001": "My first Path notebook" }, archive: { schemaVersion: 1, migratedAt: 1, sourcePrefix: "iwons:v1:" } };
  for (const [key, value] of Object.entries(original)) window.localStorage.setItem("iwons:v1:" + key, JSON.stringify(value));
  for (const [key, value] of Object.entries(previous)) window.localStorage.setItem("iwons:v2:" + key, JSON.stringify(value));
  expect(storage.migrate()).toBe(true);
  expect(storage.readArchive()?.schemaVersion).toBe(2);
  expect(storage.readArchive()?.data?.notes).toEqual(previous.notes);
  expect((storage.readArchive()?.data?.archive as {data:unknown}).data).toMatchObject(original);
  expect(window.localStorage.getItem("iwons:v2:notes")).toContain("first Path notebook");
  const backup = storage.export();
  storage.clear(); storage.import(backup);
  expect(storage.readArchive()?.data?.notes).toEqual(previous.notes);
  expect((storage.readArchive()?.data?.archive as {data:unknown}).data).toMatchObject(original);
  expect(storage.read("progress", {})).toEqual({});
});
