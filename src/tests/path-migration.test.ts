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
    expect(JSON.parse(exported).schemaVersion).toBe(4);
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
      if (key === "iwons:v4:notes")
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
describe("chapter prerequisites", () => {
  const first = problems.filter((p) => p.level === 0),
    second = problems.filter((p) => p.level === 1);
  const solved = (items: typeof problems) =>
    Object.fromEntries(items.map((p) => [p.id, true]));
  it("requires exactly seventy percent of each completed chapter", () => {
    expect(isLevelUnlocked(0, {})).toBe(true);
    expect(isLevelUnlocked(1, solved(first.slice(0, 20)))).toBe(false);
    expect(isLevelUnlocked(1, solved(first.slice(0, 21)))).toBe(true);
    expect(isLevelUnlocked(2, solved([...first, ...second.slice(0, 34)]))).toBe(
      false,
    );
    expect(isLevelUnlocked(2, solved([...first, ...second.slice(0, 35)]))).toBe(
      true,
    );
    expect(isLevelUnlocked(2, solved(second))).toBe(false);
    expect(isLevelUnlocked(2, {}, true)).toBe(true);
  });
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
