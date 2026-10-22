import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { accounts, createAccountIndexes, recordJudged, type StatsDoc, type SolveDoc, type ServerSubmission } from "@/lib/db/accounts";
import { deviceImport, mergeProgress, progressPatch } from "@/lib/accounts/contracts";
import { storage } from "@/lib/storage";
import { leaderboard, leaderboardQuery } from "@/lib/db/leaderboard";
import { handleAvailable } from "@/lib/accounts/handles";
import { judgeRepository } from "@/lib/db/judge-repository";
import { filterImportablePayload } from "@/lib/accounts/importable";
import { importedVerification } from "@/lib/accounts/verification";
import { judgeDemoProblem } from "../../scripts/curriculum/judge-problem.mjs";
import { serverProblem, type ServerProblem } from "@/lib/db/judge-repository";

let memory: MongoMemoryServer, connection: MongoClient;
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); connection = await new MongoClient(memory.getUri()).connect(); }, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });
async function fixture(name: string) {
  const db = connection.db(name); await createAccountIndexes(db); const repo = accounts(db);
  const id = await repo.oauth("github", name, `${name}@example.com`, "Learner");
  return { db, repo, id };
}
const patch = () => progressPatch.parse({ preferences: { theme: { value: "dark", updatedAt: 100 } },
  drafts: { "sample_java": { code: "draft", updatedAt: 100 } },
  foundationProgress: { topic: { completed: true, steps: { first: { code: "answer", completed: true, hintsUsed: 1, attempts: 2 } } } },
  unverifiedSolves: [{ problemId: "sample", languages: ["java"], firstSolvedAt: 100, bestRuntimeMs: 20 }],
});
describe("versioned imports and merge policy", () => {
  it("validates the wire version, code size, record keys and imported shape", () => {
    expect(deviceImport.safeParse({ version: 1, sourceSchemaVersion: 6, data: patch() }).success).toBe(true);
    expect(deviceImport.safeParse({ version: 2, sourceSchemaVersion: 6, data: patch() }).success).toBe(false);
    expect(progressPatch.safeParse({ drafts: { "sample_java": { code: "a".repeat(20001), updatedAt: 0 } } }).success).toBe(false);
    expect(progressPatch.safeParse({ drafts: { "$unsafe.path": { code: "", updatedAt: 0 } } }).success).toBe(false);
    expect(progressPatch.safeParse({ verified: true }).success).toBe(false);
  });
  it("uses timestamps per draft/preference and unions completed steps", () => {
    const current = { ...patch(), updatedAt: 100 };
    const incoming = patch(); incoming.drafts.sample_java = { code: "older", updatedAt: 50 };
    incoming.preferences.theme = { value: "light", updatedAt: 200 };
    incoming.foundationProgress.topic.steps.first.completed = false;
    incoming.foundationProgress.topic.completed = false;
    const merged = mergeProgress(current, incoming);
    expect(merged.drafts.sample_java.code).toBe("draft"); expect(merged.preferences.theme?.value).toBe("light");
    expect(merged.foundationProgress.topic.completed).toBe(true);
    expect(merged.foundationProgress.topic.steps.first.completed).toBe(true);
  });
  it("imports twice without changing data or awarding leaderboard credit", async () => {
    const { repo, id, db } = await fixture("import"); const published = new Set(["sample"]);
    const first = await repo.merge(id, patch(), published);
    const second = await repo.merge(id, patch(), published);
    expect(second).toEqual(first);
    expect(await db.collection("solves").countDocuments({ userId: id })).toBe(1);
    expect(await db.collection("solves").findOne({ userId: id })).toMatchObject({ verified: false, source: "imported" });
    expect(await db.collection("user_stats").countDocuments({})).toBe(0);
    expect(await db.collection("language_stats").countDocuments({})).toBe(0);
  });
  it("uses the same catalog filtering for preview and actual imports, retaining guest payloads", async () => {
    const { repo, id } = await fixture("custom-preview"); const input = patch();
    input.drafts["custom-problem_java"] = { code: "custom draft", updatedAt: 10 };
    input.unverifiedSolves.push({ problemId: "custom-problem", languages: ["java"], firstSolvedAt: 10 });
    const before = structuredClone(input), ids = new Set(["sample"]);
    const preview = filterImportablePayload(input, ids);
    const imported = await repo.merge(id, input, ids);
    expect(preview.skipped).toBe(2);
    expect(Object.keys(imported.drafts)).toHaveLength(Object.keys(preview.data.drafts).length);
    expect(imported.unverifiedSolves).toHaveLength(preview.data.unverifiedSolves.length);
    expect(input).toEqual(before);
    expect(await repo.merge(id, input, ids)).toEqual(imported);
  });
});
describe("verified counters and account lifecycle", () => {
  const submission = (id: string): ServerSubmission & { language: "java" } => ({ _id: "job-1", userId: id, problemId: "sample", language: "java",
    verdict: "accepted", passed: 5, total: 5, runtimeMs: 12, memoryKb: 4096, code: "solution", createdAt: new Date(1000) });
  async function retry(action: () => Promise<void>) {
    for (let i = 0; i < 300; i++) {
      try { return await action(); } catch (error) {
        if (!(error instanceof Error) || !("status" in error) || error.status !== 409 || i === 299) throw error;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
  }
  it("records concurrent retries once and counts a second language independently", async () => {
    const { db, id } = await fixture("counters"); const input = submission(id);
    await Promise.all(Array.from({ length: 15 }, () => retry(() => recordJudged(db, input, 1))));
    expect(await db.collection("submissions").countDocuments({ userId: id })).toBe(1);
    expect(await db.collection<StatsDoc>("user_stats").findOne({ userId: id })).toMatchObject({ solved: 1, points: 1, leaderboardOptIn: false });
    expect(await db.collection<StatsDoc>("language_stats").findOne({ userId: id, language: "java" })).toMatchObject({ solved: 1, points: 1 });
    await recordJudged(db, { ...input, _id: "job-2", language: "python", createdAt: new Date(2000) }, 1);
    expect(await db.collection<StatsDoc>("user_stats").findOne({ userId: id })).toMatchObject({ solved: 1, points: 1, lastSolvedAt: new Date(1000) });
    expect(await db.collection<StatsDoc>("language_stats").findOne({ userId: id, language: "python" })).toMatchObject({ solved: 1, points: 1 });
    expect((await db.collection<SolveDoc>("solves").findOne({ userId: id }))?.languages.sort()).toEqual(["java", "python"]);
  }, 15_000);
  it("upgrades imported solves only through judging and repairs a missing projection", async () => {
    const { db, repo, id } = await fixture("upgrade");
    await repo.merge(id, patch(), new Set(["sample"]));
    const input = submission(id); await recordJudged(db, input, 1);
    await db.collection("language_stats").deleteMany({ userId: id });
    await recordJudged(db, input, 1);
    expect(await db.collection("solves").findOne({ userId: id })).toMatchObject({ verified: true, source: "judged" });
    expect(await db.collection<StatsDoc>("user_stats").findOne({ userId: id })).toMatchObject({ solved: 1 });
    expect(await db.collection<StatsDoc>("language_stats").findOne({ userId: id })).toMatchObject({ solved: 1 });
  });
  it("upgrades concurrent imported verification submissions once per problem and language", async () => {
    const { db, repo, id } = await fixture("concurrent-upgrade");
    await repo.merge(id, patch(), new Set(["sample"]));
    await Promise.all(Array.from({ length: 6 }, (_, index) => retry(() => recordJudged(db, { ...submission(id), _id: `verify-${index}` }, 1))));
    expect(await db.collection("solves").findOne({ userId: id })).toMatchObject({ verified: true, source: "judged" });
    for (const name of ["user_stats", "language_stats"])
      expect(await db.collection(name).findOne({ userId: id })).toMatchObject({ solved: 1, points: 1 });
    expect(await db.collection("submissions").countDocuments({ userId: id })).toBe(6);
  });
  it("offers only owned unverified imports, with saved code and published server eligibility", async () => {
    const { db, repo, id } = await fixture("verification-candidates");
    const demo = serverProblem.parse(judgeDemoProblem());
    await db.collection<ServerProblem>("judge_problems").insertMany([demo, { ...demo, _id: "missing-code", slug: "missing-code" }]);
    const ids = [demo._id, "missing-code", "legacy-problem"];
    await repo.merge(id, progressPatch.parse({ drafts: { [`${demo._id}_java`]: { code: "public class Main {}", updatedAt: 100 } },
      unverifiedSolves: ids.map(problemId => ({ problemId, languages: ["java"], firstSolvedAt: 100 })) }), new Set(ids));
    vi.stubEnv("JUDGE0_PROVIDER", "onlinecompiler");
    try {
      const result = await importedVerification(db, id);
      expect(result.concurrency).toBe(1);
      expect(result.items.map(item => [item.problemId, item.reason])).toEqual([
        ["legacy-problem", "unsupported"], ["missing-code", "missing_code"], [demo._id, "ready"],
      ]);
      const json = JSON.stringify(result);
      for (const secret of [id, "userId", "email", "private-zero", "stdin", "expected", "tokens"]) expect(json).not.toContain(secret);
      await recordJudged(db, { ...submission(id), problemId: demo._id }, 1);
      expect((await importedVerification(db, id)).items.some(item => item.problemId === demo._id)).toBe(false);
      expect((await importedVerification(db, "another-user")).items).toEqual([]);
    } finally { vi.unstubAllEnvs(); }
  });
  it("propagates handles/opt-in, enforces uniqueness, and removes all account rows", async () => {
    const { db, repo, id } = await fixture("deletion");
    await recordJudged(db, submission(id), 1);
    await repo.update(id, { handle: "learner_one", leaderboardOptIn: true });
    for (const name of ["user_stats", "language_stats"])
      expect(await db.collection(name).findOne({ userId: id })).toMatchObject({ handle: "learner_one", leaderboardOptIn: true });
    const other = await repo.oauth("google", "other", "other@example.com", "Other");
    await expect(repo.update(other, { handle: "learner_one" })).rejects.toMatchObject({ status: 409 });
    await repo.delete(id);
    expect(await repo.user(id)).toBeNull();
    for (const name of ["progress", "solves", "submissions", "user_stats", "language_stats", "judge_jobs"])
      expect(await db.collection(name).countDocuments({ userId: id })).toBe(0);
    await expect(recordJudged(db, submission(id), 1)).rejects.toMatchObject({ status: 409 });
  });
});

describe("handle availability hints and authoritative saves", () => {
  it("validates format and reserved words, accepts the owner's handle, and survives concurrent saves", async () => {
    const { db, repo, id } = await fixture("handles"); const limiter = judgeRepository(db);
    await repo.update(id, { handle: "learner" });
    for (const handle of ["ab", "UPPER", "has-dash", "x".repeat(21)])
      expect(await handleAvailable(db, limiter, handle, "ip", id)).toEqual({ available: false, reason: "invalid" });
    expect(await handleAvailable(db, limiter, "administrator", "ip", id)).toEqual({ available: false, reason: "reserved" });
    expect(await handleAvailable(db, limiter, "learner", "ip", id)).toEqual({ available: true });
    expect(await handleAvailable(db, limiter, "learner", "ip", null)).toEqual({ available: false, reason: "taken" });
    const other = await repo.oauth("github", "second", "second@example.com", "Other");
    expect(await handleAvailable(db, limiter, "race_handle", "ip", id)).toEqual({ available: true });
    expect(await handleAvailable(db, limiter, "race_handle", "ip", other)).toEqual({ available: true });
    const saves = await Promise.allSettled([repo.update(id, { handle: "race_handle" }), repo.update(other, { handle: "race_handle" })]);
    expect(saves.filter(value => value.status === "fulfilled")).toHaveLength(1);
    expect(saves.filter(value => value.status === "rejected")).toMatchObject([{ reason: { status: 409 } }]);
  });
  it("enforces independent per-IP and per-user limits across concurrent requests", async () => {
    const { db, id } = await fixture("handle-limits"); const limiter = judgeRepository(db);
    const byIP = await Promise.allSettled(Array.from({ length: 21 }, () => handleAvailable(db, limiter, "free_handle", "shared-ip", null)));
    expect(byIP.filter(value => value.status === "fulfilled")).toHaveLength(20);
    const byUser = await Promise.allSettled(Array.from({ length: 21 }, (_, i) => handleAvailable(db, limiter, "free_handle", `ip-${i}`, id)));
    expect(byUser.filter(value => value.status === "fulfilled")).toHaveLength(20);
  });
});
class MemoryStorage {
  [key: string]: unknown;
  getItem(key: string) { return Object.hasOwn(this, key) ? this[key] as string : null; }
  setItem(key: string, value: string) { this[key] = value; }
  removeItem(key: string) { delete this[key]; }
}
describe("separate guest and account caches", () => {
  beforeEach(() => { vi.stubGlobal("window", { localStorage: new MemoryStorage(), dispatchEvent: vi.fn() }); storage.switchAccount(null); });
  afterAll(() => { storage.switchAccount(null); vi.unstubAllGlobals(); });
  it("preserves guest drafts and lessons through login, cache reset and logout", () => {
    storage.write("drafts:sample:java", "guest code"); storage.write("topicFoundations", patch().foundationProgress);
    const backup = storage.export();
    storage.switchAccount("account-one"); expect(storage.read("drafts:sample:java", "")).toBe("");
    storage.write("drafts:sample:java", "account code");
    storage.verificationQueue({ version: 1, items: { sample: "pending" }, starts: [], blockedUntil: 0 });
    expect(storage.export()).not.toContain("blockedUntil");
    expect(storage.export()).not.toContain("guest code");
    storage.clear(); storage.switchAccount(null);
    expect(storage.read("drafts:sample:java", "")).toBe("guest code");
    expect(storage.read("topicFoundations", {})).toEqual(patch().foundationProgress);
    expect(JSON.parse(storage.export()).data).toEqual(JSON.parse(backup).data);
  });
});
describe("indexed opt-in leaderboards", () => {
  it("orders distinct verified counts, points and earliest achievement, with stable cursors and own rank", async () => {
    const { db, repo, id } = await fixture("boards");
    await repo.update(id, { handle: "learner", leaderboardOptIn: true });
    const row = (key: string, solved: number, points: number, at: number, optedIn = true): StatsDoc => ({
      _id: key, userId: key, handle: key, avatar: "L", leaderboardOptIn: optedIn, solved, points,
      lastSolvedAt: new Date(at), problemIds: [],
    });
    await db.collection<StatsDoc>("user_stats").insertMany([row("first", 5, 9, 100), row("second", 5, 9, 200),
      { ...row("learner", 3, 7, 100), _id: id, userId: id }, row("private", 99, 999, 0, false)]);
    await db.collection<StatsDoc>("language_stats").insertMany([{ ...row("first-java", 2, 2, 100), handle: "first", language: "java" },
      { ...row("learner-python", 1, 1, 100), userId: id, handle: "learner", language: "python" }]);
    const first = await leaderboard(db, leaderboardQuery.parse({ limit: 2 }), await repo.user(id));
    expect(first.rows.map(item => item.handle)).toEqual(["first", "second"]);
    expect(first.own).toMatchObject({ handle: "learner", rank: 3, solved: 3 });
    const next = await leaderboard(db, leaderboardQuery.parse({ limit: 2, cursor: first.nextCursor }), null);
    expect(next.rows.map(item => [item.handle, item.rank])).toEqual([["learner", 3]]);
    const java = await leaderboard(db, leaderboardQuery.parse({ scope: "language", language: "java" }), null);
    expect(java.rows).toHaveLength(1); expect(java.rows[0]).toMatchObject({ handle: "first", solved: 2 });
    for (const result of [first, next, java]) {
      expect(JSON.stringify(result)).not.toContain("userId");
      expect(JSON.stringify(result)).not.toContain("email");
      expect(JSON.stringify(result)).not.toContain("problemIds");
    }
    expect(leaderboardQuery.safeParse({ scope: "language" }).success).toBe(false);
    await expect(leaderboard(db, leaderboardQuery.parse({ cursor: "invalid" }), null)).rejects.toMatchObject({ status: 400 });
  });
});
