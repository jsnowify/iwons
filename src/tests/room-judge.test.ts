import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createJudgeIndexes, judgeRepository } from "@/lib/db/judge-repository";
import { createAccountIndexes } from "@/lib/db/accounts";
import { createRoom, createRoomIndexes, endRoom, joinRoom, type Person, type RoomDoc } from "@/lib/db/rooms";
import { addCatalogProblem, addCustomProblem, createCustomProblem, roomJudgeProblem } from "@/lib/db/room-problems";
import { roomEffects, roomLeaderboard } from "@/lib/db/room-stats";
import { judgeService } from "@/lib/judge0/service";
import { decoded, encoded, type JudgeClient, type JudgePayload, type JudgeSubmission } from "@/lib/judge0/client";
import { normalizeOutput } from "@/lib/judge0/results";
import { createRoomInput, customProblemInput } from "@/lib/rooms/contracts";
import { searchCatalog } from "@/lib/rooms/catalog";
import { getProblems } from "@/lib/problems";

// End to end through the real judge service: the room resolver, the catalog adapter, grading and the
// room effects. Only the remote executor is replaced by a local one that runs JavaScript in-process.
const maximums = { max_cpu_time_limit: 2, max_wall_time_limit: 4, max_memory_limit: 64000, max_stack_limit: 32000, max_processes_and_or_threads: 15, max_max_file_size: 32, max_submission_batch_size: 20 };
function execute(source: string, stdin: string) {
  const lines: string[] = [];
  new Function("require", "console", source)(() => ({ readFileSync: () => stdin }), { log: (...values: unknown[]) => lines.push(values.join(" ")) });
  return lines.join(String.fromCharCode(10));
}
function localClient() {
  const results = new Map<string, JudgeSubmission>(), sources: string[] = [];
  const client: JudgeClient = {
    languages: vi.fn(async () => []), config: vi.fn(async () => maximums),
    submit: vi.fn(async (payloads: JudgePayload[]) => payloads.map(payload => {
      const token = crypto.randomUUID(), source = decoded(payload.source_code);
      sources.push(source);
      try {
        const stdout = execute(source, decoded(payload.stdin));
        results.set(token, { token, status_id: normalizeOutput(stdout) === normalizeOutput(decoded(payload.expected_output)) ? 3 : 4, stdout: encoded(stdout), time: "0.01", memory: 100 });
      } catch (error) { results.set(token, { token, status_id: 11, stderr: encoded(String(error)), time: "0.01", memory: 100 }); }
      return token;
    })),
    read: vi.fn(async (tokens: string[]) => tokens.map(token => results.get(token)!)),
  };
  return { client, sources };
}
// Database-backed tests can be slow when the whole suite runs in parallel.
vi.setConfig({ testTimeout: 30_000 });
let memory: MongoMemoryServer, connection: MongoClient;
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); connection = await new MongoClient(memory.getUri()).connect(); }, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });

const person = (name: string): Person => ({ id: `user-${name}`, username: name, displayName: name.toUpperCase() });
async function world(name: string) {
  const db = connection.db(name);
  await Promise.all([createRoomIndexes(db), createJudgeIndexes(db), createAccountIndexes(db)]);
  const { client, sources } = localClient(), repo = judgeRepository(db);
  const service = judgeService(repo, client, async (job, result) => { if (job.roomId) await roomEffects(db, job, result); },
    async input => (await roomJudgeProblem(db, input)).problem);
  const host = person("host"), now = new Date();
  const room = await createRoom(db, host, createRoomInput.parse({ name: "Judge room" }), now);
  await joinRoom(db, person("member"), room.inviteToken, now);
  return { db, service, sources, host, room, now, repo };
}
async function finish(service: ReturnType<typeof judgeService>, jobId: string, who: Person) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const state = await service.poll(jobId, "ip", who.id);
    if (state.state === "done") return state.result;
  }
  throw new Error("The job never finished.");
}
const reference = (id: string) => (JSON.parse(readFileSync("scripts/references.json", "utf8")) as { slug: string; js: string }[]).find(item => item.slug === getProblems().find(p => p.id === id)!.slug)!.js;
const echoSolution = 'const text = require("fs").readFileSync(0, "utf8").trim(); console.log(text + text);';
const customInput = () => customProblemInput.parse({ title: "Echo twice", statement: "Print the input two times.", difficulty: "easy",
  starterCode: { java: "public class Main {}", python: "print()", javascript: "console.log()" },
  testCases: [{ input: "a", expectedOutput: "aa", isHidden: false }, { input: "xy", expectedOutput: "xyxy", isHidden: true }] });

describe("catalog problems through the room judge", () => {
  it("judges a correct solution, records it in the room only, and wraps the code server-side", async () => {
    const { db, service, sources, room, now } = await world("catalog-accept");
    const id = searchCatalog("", 1)[0].id;
    await addCatalogProblem(db, room, id, now);
    const who = person("member");
    const { jobId } = await service.create({ problemId: `c-${id}`, language: "javascript", code: reference(id), mode: "submit", roomId: room._id }, "ip", who.id);
    const result = await finish(service, jobId, who);
    expect(result.verdict).toBe("accepted");
    expect(result.passed).toBe(result.total);
    expect(sources.every(source => source.includes("__iwonsLog") && source.includes(reference(id).trim().slice(0, 20)))).toBe(true);
    const stored = (await repoJob(db, jobId))!;
    expect(stored).toMatchObject({ roomId: room._id, problemRefKey: `c-${id}`, userId: who.id });
    expect((await roomLeaderboard(db, room, who.id, { limit: 5 })).rows.map(row => [row.username, row.solved])).toEqual([["member", 1]]);
    for (const name of ["user_stats", "language_stats", "solves", "submissions"]) expect(await db.collection(name).countDocuments(), name).toBe(0);
  });
  it("shows a kind failure for visible cases, hides hidden values, and counts the attempt", async () => {
    const { db, service, room, now } = await world("catalog-reject");
    const id = searchCatalog("", 1)[0].id;
    const catalog = (await addCatalogProblem(db, room, id, now)).refKey;
    const who = person("member"), name = getProblems().find(p => p.id === id)!;
    const function_name = /function\s+([A-Za-z_$][\w$]*)/.exec(reference(id))![1];
    const { jobId } = await service.create({ problemId: catalog, language: "javascript", code: `function ${function_name}() { return "nope"; }`, mode: "submit", roomId: room._id }, "ip", who.id);
    const result = await finish(service, jobId, who);
    expect(name).toBeTruthy();
    expect(result.verdict).toBe("wrong_answer");
    expect(result.cases.every(item => item.stdout.startsWith("FAIL got="))).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/"e":|hiddenCases"\s*:\s*\[\s*\{[^}]*stdin/);
    expect(await db.collection("room_stats").countDocuments({ roomId: room._id })).toBe(0);
    expect((await db.collection("room_solves").findOne({ roomId: room._id, userId: who.id }))!.attemptCount).toBe(1);
  });
});
async function repoJob(db: ReturnType<MongoClient["db"]>, id: string) { return db.collection("judge_jobs").findOne({ _id: id as never }); }

describe("custom problems through the room judge", () => {
  it("validates with a reference solution, publishes, locks tests after a submission, then closes with the room", async () => {
    const { db, service, host, room, now } = await world("custom-flow");
    const custom = await createCustomProblem(db, room, host.id, customInput(), now);
    const key = `u-${custom._id}`;
    // Members cannot validate or run an unvalidated, unlisted problem.
    await expect(service.create({ problemId: key, language: "javascript", code: echoSolution, mode: "submit", roomId: room._id }, "ip", person("member").id, { purpose: "validate" })).rejects.toMatchObject({ status: 403 });
    await expect(service.create({ problemId: key, language: "javascript", code: echoSolution, mode: "run", roomId: room._id }, "ip", person("member").id)).rejects.toMatchObject({ status: 404 });
    const wrong = await service.create({ problemId: key, language: "javascript", code: 'console.log("nope")', mode: "submit", roomId: room._id }, "ip", host.id, { purpose: "validate" });
    expect((await finish(service, wrong.jobId, host)).verdict).toBe("wrong_answer");
    expect((await db.collection("custom_problems").findOne({ _id: custom._id as never }))!.validated).toBe(false);
    const good = await service.create({ problemId: key, language: "javascript", code: echoSolution, mode: "submit", roomId: room._id }, "ip2", host.id, { purpose: "validate" });
    expect((await finish(service, good.jobId, host)).verdict).toBe("accepted");
    expect((await db.collection("custom_problems").findOne({ _id: custom._id as never }))!.validated).toBe(true);
    expect(await db.collection("room_stats").countDocuments({ roomId: room._id })).toBe(0);
    await addCustomProblem(db, room, custom._id, now);
    const member = person("member");
    const submit = await service.create({ problemId: key, language: "javascript", code: echoSolution, mode: "submit", roomId: room._id }, "ip3", member.id);
    const result = await finish(service, submit.jobId, member);
    expect(result).toMatchObject({ verdict: "accepted", passed: 2, total: 2 });
    expect(result.hiddenCases).toEqual([{ index: 1, status: "passed" }]);
    expect((await db.collection("custom_problems").findOne({ _id: custom._id as never }))!.testsLocked).toBe(true);
    await endRoom(db, room, new Date());
    await expect(service.create({ problemId: key, language: "javascript", code: echoSolution, mode: "submit", roomId: room._id }, "ip4", member.id)).rejects.toMatchObject({ status: 409 });
  });
  it("rejects room requests from guests and from people who are not members", async () => {
    const { service, room } = await world("custom-auth");
    const request = { problemId: "u-abc", language: "javascript", code: "x", mode: "run", roomId: room._id } as const;
    await expect(service.create(request, "ip", null)).rejects.toMatchObject({ status: 401 });
    await expect(service.create(request, "ip", "user-stranger")).rejects.toMatchObject({ status: 404 });
    const missing = await world("custom-missing");
    await expect(missing.service.create({ ...request, roomId: "A".repeat(22) }, "ip", missing.host.id)).rejects.toMatchObject({ status: 404 });
  });
});
export type { RoomDoc };
