import { beforeEach, expect, it, vi } from "vitest";
import { storage } from "@/lib/storage";
import { emptyLearnProgress } from "@/lib/foundations/model-v2";
import { emptyFoundationsProgress } from "@/lib/foundations/types";
import { emptyLearningState } from "@/lib/foundations/learning-state";
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
  expect(storage.read("settings", {})).toEqual({ ...pathWork.settings, lessonLanguage: "en", codeTrack: "typescript" });
  expect(storage.read("foundations", null)).toEqual(emptyLearnProgress());
  expect(storage.migrate()).toBe(true);
});
it("round-trips v4 lessons, scores, drafts and language together with Path data", () => {
  seed(); storage.migrate();
  const progress = { lessonsRead: { l1: true }, exercisesSolved: { e1: true }, checkpointScores: { q1: { correct: 4, total: 5, at: 100 } } };
  storage.write("foundations", {...emptyLearnProgress(), java:progress}); storage.write("settings", { ...pathWork.settings, lessonLanguage: "ceb" });
  const backup = storage.export(); expect(JSON.parse(backup).schemaVersion).toBe(6);
  storage.clear(); storage.import(backup);
  expect(storage.read("foundations", null)).toEqual({...emptyLearnProgress(),java:progress});
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
  window.localStorage.setItem = (key, value) => { if (key === "iwons:v6:notes") throw new DOMException("Full", "QuotaExceededError"); original(key, value); };
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
it("copies actual v4 lesson progress into Java without deleting the old edition",()=>{
 const foundations={lessonsRead:{"cp1-m1-l1":true},exercisesSolved:{"cp1-e1":true},checkpointScores:{"cp1-m1":{correct:4,total:5,at:100}}};
 window.localStorage.setItem("iwons:v4:schemaVersion","4");window.localStorage.setItem("iwons:v4:foundations",JSON.stringify(foundations));window.localStorage.setItem("iwons:v4:notes",JSON.stringify(pathWork.notes));
 expect(storage.migrate()).toBe(true);expect(storage.read("foundations",null)).toEqual({...emptyLearnProgress(),java:foundations});expect(window.localStorage.getItem("iwons:v4:foundations")).toBe(JSON.stringify(foundations));expect(storage.read("notes",{})).toEqual(pathWork.notes);
});
it("imports a v4 backup into Java and rejects malformed v5 tracks before replacement",()=>{
 const foundations={lessonsRead:{l:true},exercisesSolved:{},checkpointScores:{}};
 storage.import(JSON.stringify({app:"Iwons",schemaVersion:4,data:{...pathWork,foundations}}));expect(storage.read("foundations",null)).toEqual({...emptyLearnProgress(),java:foundations});
 const before=JSON.parse(storage.export()).data;
 expect(()=>storage.import(JSON.stringify({app:"Iwons",schemaVersion:5,data:{foundations:{java:foundations}}}))).toThrow();expect(JSON.parse(storage.export()).data).toEqual(before);
});
it("archives the version 5 namespace and round-trips learning data in version 6", () => {
 const old = { ...pathWork, schemaVersion:5, foundations:emptyLearnProgress() };
 for (const [key,value] of Object.entries(old)) window.localStorage.setItem(`iwons:v5:${key}`,JSON.stringify(value));
 expect(storage.migrate()).toBe(true);
 expect(storage.read("learning",null)).toEqual(emptyLearningState());
 for (const [key,value] of Object.entries(old)) expect(window.localStorage.getItem(`iwons:v5:${key}`)).toBe(JSON.stringify(value));
 const learning={...emptyLearningState(),explanations:{lesson:"I checked the line order."}};
 storage.write("learning",learning); const backup=storage.export(); storage.clear();storage.import(backup);
 expect(storage.read("learning",null)).toEqual(learning);
});
it("rejects malformed learning backups atomically", () => {
 seed();storage.migrate();const before=JSON.parse(storage.export()).data;
 expect(()=>storage.import(JSON.stringify({app:"Iwons",schemaVersion:6,data:{...before,learning:{...emptyLearningState(),attempts:[{confidence:8}]}}}))).toThrow();
 expect(JSON.parse(storage.export()).data).toEqual(before);
});

it("round-trips lesson slips and Parsons arrangements independently of editor code",()=>{
 seed();storage.migrate();
 const drafts={"drafts:lesson-cp1-m1-l1:python":JSON.stringify({guess:"Ready",code:'print("Open")',traceGuess:"1"}),"drafts:parsons-cp1-m1-order:python":JSON.stringify(["input","prefix","output"]),"drafts:cp1-m1-order:python":"previous editor draft"};
 for(const [key,value]of Object.entries(drafts))storage.write(key,value);
 const backup=storage.export();storage.clear();storage.import(backup);
 for(const [key,value]of Object.entries(drafts))expect(storage.read(key,"")).toBe(value);
});
