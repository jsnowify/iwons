import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import {
  createRoom, createRoomIndexes, endRoom, invitePreview, joinRoom, kickMember, leaveRoom, memberContext, hostContext, regenerateInvite, roomMembers, updateRoom,
  type CustomProblemDoc, type Person, type RoomDoc,
} from "@/lib/db/rooms";
import {
  addCatalogProblem, addCustomProblem, createCustomProblem, listRoomProblems, problemDetail, removeProblem, roomJudgeProblem, updateCustomProblem, fitCases,
} from "@/lib/db/room-problems";
import { roomEffects, roomLeaderboard, roomMe } from "@/lib/db/room-stats";
import { createAccountIndexes } from "@/lib/db/accounts";
import type { JudgeJob } from "@/lib/db/judge-repository";
import type { PublicJudgeResult } from "@/lib/judge0/contracts";
import { createRoomInput, customProblemInput, patchRoomInput } from "@/lib/rooms/contracts";
import { searchCatalog } from "@/lib/rooms/catalog";

// Database-backed tests can be slow when the whole suite runs in parallel.
vi.setConfig({ testTimeout: 30_000 });
let memory: MongoMemoryServer, connection: MongoClient;
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); connection = await new MongoClient(memory.getUri()).connect(); }, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });

const person = (name: string): Person => ({ id: `user-${name}`, username: name, displayName: name.toUpperCase() });
const input = (extra: Record<string, unknown> = {}) => createRoomInput.parse({ name: "Study group", ...extra });
async function fresh(name: string) {
  const db = connection.db(name); await createRoomIndexes(db); await createAccountIndexes(db);
  return db;
}
async function setup(name: string, extra: Record<string, unknown> = {}) {
  const db = await fresh(name), host = person("host"), now = new Date();
  const room = await createRoom(db, host, input(extra), now);
  return { db, host, room, now };
}
const customInput = (extra: Record<string, unknown> = {}) => customProblemInput.parse({ title: "Echo twice", statement: "Print the input two times.", difficulty: "easy",
  starterCode: { java: "public class Main {}", python: "print()", javascript: "console.log()" },
  testCases: [{ input: "a", expectedOutput: "aa", isHidden: false }, { input: "SECRET-IN", expectedOutput: "SECRET-OUT", isHidden: true }], ...extra });
const accepted = (passed = 2): PublicJudgeResult => ({ verdict: "accepted", failureSource: "user", passed, total: passed, runtimeMs: 12, memoryKb: 1, message: "ok", cases: [] });
const rejected: PublicJudgeResult = { verdict: "wrong_answer", failureSource: "user", passed: 1, total: 2, runtimeMs: 12, memoryKb: 1, message: "no", cases: [] };
let counter = 0;
const job = (room: RoomDoc, who: Person, refKey: string, at: Date, extra: Partial<JudgeJob> = {}): JudgeJob => ({ _id: `job-${++counter}`, tokens: [], caseRefs: [], mode: "submit",
  userId: who.id, ipHash: "ip", language: "python", problemId: refKey, code: "x", expected: [], createdAt: at, expiresAt: new Date(at.getTime() + 3_600_000),
  finalizedAt: at, result: null, roomId: room._id, problemRefKey: refKey, ...extra });
const catalogId = () => searchCatalog("", 1)[0].id;
async function ready(name: string, extra: Record<string, unknown> = {}) {
  const base = await setup(name, extra);
  const custom = await createCustomProblem(base.db, base.room, base.host.id, customInput(), base.now);
  await base.db.collection<CustomProblemDoc>("custom_problems").updateOne({ _id: custom._id }, { $set: { validated: true } });
  const listed = await addCustomProblem(base.db, base.room, custom._id, base.now);
  const catalog = await addCatalogProblem(base.db, base.room, catalogId(), base.now);
  return { ...base, custom, customKey: listed.refKey, catalogKey: catalog.refKey };
}
async function members(db: Db, room: RoomDoc, names: string[]) {
  const link = (await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.inviteToken;
  for (const name of names) await joinRoom(db, person(name), link, new Date());
}

describe("room lifecycle and limits", () => {
  it("validates the contract: hard member ceiling, window order and sanitized text", () => {
    expect(createRoomInput.safeParse({ name: "ab" }).success).toBe(false);
    expect(createRoomInput.safeParse({ name: "Good room", maxMembers: 101 }).success).toBe(false);
    expect(createRoomInput.safeParse({ name: "Good room", maxMembers: 0 }).success).toBe(false);
    expect(createRoomInput.safeParse({ name: "Good room", startsAt: "2030-01-02T00:00:00Z", endsAt: "2030-01-01T00:00:00Z" }).success).toBe(false);
    expect(createRoomInput.parse({ name: "  Team   room  " }).name).toBe("Team room");
    expect(createRoomInput.parse({ name: "Good room" }).maxMembers).toBe(100);
    expect(patchRoomInput.safeParse({ status: "active" }).success).toBe(false);
    expect(customProblemInput.safeParse({ ...customInput(), testCases: [{ input: "a", expectedOutput: "b", isHidden: false }, { input: "c", expectedOutput: "d", isHidden: false }] }).success).toBe(false);
    expect(customProblemInput.safeParse({ ...customInput(), testCases: Array.from({ length: 21 }, (_, i) => ({ input: "a", expectedOutput: "b", isHidden: i > 0 })) }).success).toBe(false);
    expect(customProblemInput.safeParse({ ...customInput(), testCases: [{ input: "a", expectedOutput: "b", isHidden: false }, { input: "x".repeat(10_001), expectedOutput: "d", isHidden: true }] }).success).toBe(false);
  });
  it("never admits more members than the limit when many people join at once", async () => {
    const { db, room } = await setup("capacity", { maxMembers: 5 });
    const token = room.inviteToken;
    const outcomes = await Promise.allSettled(Array.from({ length: 40 }, (_, index) => joinRoom(db, person(`p${index}`), token, new Date())));
    const joined = outcomes.filter(item => item.status === "fulfilled").length;
    const rejected = outcomes.filter((item): item is PromiseRejectedResult => item.status === "rejected");
    expect(joined).toBe(4);
    expect(rejected.every(item => (item.reason as { status: number }).status === 409)).toBe(true);
    const stored = (await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!;
    expect(stored.memberCount).toBe(5);
    expect(await db.collection("room_members").countDocuments({ roomId: room._id, status: "active" })).toBe(5);
  }, 60_000);
  it("keeps the counter right when one person joins many times at once", async () => {
    const { db, room } = await setup("duplicate-join");
    const same = person("same");
    await Promise.allSettled(Array.from({ length: 12 }, () => joinRoom(db, same, room.inviteToken, new Date())));
    expect(await db.collection("room_members").countDocuments({ roomId: room._id, userId: same.id })).toBe(1);
    expect((await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.memberCount).toBe(2);
  });
  it("lets leaving members rejoin, blocks the host from leaving and enforces the member floor on edits", async () => {
    const { db, room, now } = await setup("leave");
    await members(db, room, ["a", "b", "c"]);
    await leaveRoom(db, room, person("a").id);
    expect((await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.memberCount).toBe(3);
    await expect(leaveRoom(db, room, room.hostUserId)).rejects.toMatchObject({ status: 409 });
    await joinRoom(db, person("a"), room.inviteToken, new Date());
    await expect(updateRoom(db, room, patchRoomInput.parse({ maxMembers: 2 }), now)).rejects.toMatchObject({ status: 409 });
    expect((await updateRoom(db, room, patchRoomInput.parse({ maxMembers: 10 }), now)).maxMembers).toBe(10);
  });
  it("keeps a kicked member out with the same link and lets them back after the link is regenerated", async () => {
    const { db, room, now } = await setup("kick");
    await members(db, room, ["x"]);
    await kickMember(db, room, person("x").id, now);
    await expect(joinRoom(db, person("x"), room.inviteToken, new Date())).rejects.toMatchObject({ status: 403 });
    await expect(memberContext(db, room.code, person("x").id, now)).rejects.toMatchObject({ status: 404 });
    const next = await regenerateInvite(db, room, "1d", now);
    expect((await joinRoom(db, person("x"), next.inviteToken, new Date())).alreadyMember).toBe(false);
    expect((await roomMembers(db, room._id)).map(item => item.username).sort()).toEqual(["host", "x"]);
    expect((await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.memberCount).toBe(2);
    await expect(kickMember(db, room, room.hostUserId, now)).rejects.toMatchObject({ status: 400 });
  });
  it("invalidates the old invite when it is regenerated and enforces expiry", async () => {
    const { db, room, now } = await setup("invite");
    const old = room.inviteToken, next = await regenerateInvite(db, room, "never", now);
    expect(next.inviteToken).not.toBe(old);
    await expect(joinRoom(db, person("late"), old, new Date())).rejects.toMatchObject({ status: 404 });
    await expect(invitePreview(db, old, now)).rejects.toMatchObject({ status: 404 });
    const preview = await invitePreview(db, next.inviteToken, now);
    expect(preview).toEqual({ name: "Study group", hostName: "HOST", memberCount: 1, maxMembers: 100, state: "ok" });
    expect(Object.keys(preview).sort()).toEqual(["hostName", "maxMembers", "memberCount", "name", "state"]);
    const short = await regenerateInvite(db, room, "1h", now);
    await expect(joinRoom(db, person("slow"), short.inviteToken, new Date(now.getTime() + 2 * 3_600_000))).rejects.toMatchObject({ status: 410 });
  });
  it("checks permissions: members only for room data, host only for management", async () => {
    const { db, room, now } = await setup("permissions");
    await members(db, room, ["m"]);
    await expect(memberContext(db, room.code, "someone-else", now)).rejects.toMatchObject({ status: 404 });
    await expect(hostContext(db, room.code, person("m").id, now)).rejects.toMatchObject({ status: 403 });
    expect((await hostContext(db, room.code, room.hostUserId, now)).isHost).toBe(true);
  });
  it("limits how many rooms one host can run at the same time", async () => {
    const db = await fresh("hosted-limit"), host = person("busy"), now = new Date();
    for (let index = 0; index < 10; index++) await createRoom(db, host, input({ name: `Room ${index}` }), now);
    await expect(createRoom(db, host, input({ name: "One too many" }), now)).rejects.toMatchObject({ status: 409 });
  });
});

describe("room problems and custom problems", () => {
  it("adds catalog and validated custom problems once, with ordered slots and a removal guard", async () => {
    const { db, room, now, customKey, catalogKey } = await ready("problems");
    expect((await listRoomProblems(db, room._id)).map(item => item.order)).toEqual([1, 2]);
    await expect(addCatalogProblem(db, room, catalogId(), now)).rejects.toMatchObject({ status: 409 });
    await expect(addCatalogProblem(db, room, "not-a-real-problem", now)).rejects.toMatchObject({ status: 400 });
    const unvalidated = await createCustomProblem(db, room, room.hostUserId, customInput({ title: "Not ready" }), now);
    await expect(addCustomProblem(db, room, unvalidated._id, now)).rejects.toMatchObject({ status: 409 });
    expect((await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.problemCount).toBe(2);
    await db.collection("room_problems").updateOne({ roomId: room._id, refKey: catalogKey }, { $set: { locked: true } });
    await expect(removeProblem(db, room, catalogKey)).rejects.toMatchObject({ status: 409 });
    await removeProblem(db, room, customKey);
    expect((await db.collection<RoomDoc>("rooms").findOne({ _id: room._id }))!.problemCount).toBe(1);
  });
  it("hides hidden tests from members and keeps problem details private until the room starts", async () => {
    const { db, room, customKey } = await ready("leaks");
    const detail = await problemDetail(db, room, customKey);
    const text = JSON.stringify(detail);
    expect(detail.visibleCases).toEqual([{ id: "case-1", stdin: "a", expected: "aa" }]);
    expect(text).not.toContain("SECRET-OUT");
    expect(text).not.toContain("SECRET-IN");
    const catalog = await problemDetail(db, room, (await listRoomProblems(db, room._id))[1].refKey);
    expect(JSON.stringify(catalog)).not.toMatch(/hiddenCases|privateData|"e":/);
    const future = await setup("not-started", { startsAt: new Date(Date.now() + 86_400_000).toISOString() });
    await expect(roomJudgeProblem(future.db, { roomId: future.room._id, userId: future.host.id, refKey: "c-x", language: "python", mode: "run" })).rejects.toMatchObject({ status: 409 });
  });
  it("locks tests after the first submission but still allows title and statement edits", async () => {
    const { db, room, now, custom, customKey } = await ready("lock");
    await members(db, room, ["s"]);
    const judged = await roomJudgeProblem(db, { roomId: room._id, userId: person("s").id, refKey: customKey, language: "java", mode: "submit" });
    expect(judged.problem.cases.filter(item => item.hidden)).toHaveLength(1);
    expect((await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: custom._id }))!.testsLocked).toBe(true);
    await expect(updateCustomProblem(db, room, custom._id, customProblemInput.partial().parse({ testCases: customInput().testCases }), now)).rejects.toMatchObject({ status: 409 });
    expect((await updateCustomProblem(db, room, custom._id, { title: "Echo it twice" }, now)).title).toBe("Echo it twice");
    expect((await listRoomProblems(db, room._id))[0].title).toBe("Echo it twice");
  });
  it("requires validation against the exact tests, and only the host may validate", async () => {
    const { db, room, now } = await setup("validate");
    await members(db, room, ["m"]);
    const custom = await createCustomProblem(db, room, room.hostUserId, customInput(), now);
    const key = `u-${custom._id}`;
    await expect(roomJudgeProblem(db, { roomId: room._id, userId: person("m").id, refKey: key, language: "python", mode: "submit", purpose: "validate" })).rejects.toMatchObject({ status: 403 });
    const { problem } = await roomJudgeProblem(db, { roomId: room._id, userId: room.hostUserId, refKey: key, language: "python", mode: "submit", purpose: "validate" });
    expect(problem.cases).toHaveLength(2);
    const stale = job(room, { id: room.hostUserId, username: "host", displayName: "HOST" }, key, now, { purpose: "validate", testsHash: "outdated" });
    await roomEffects(db, stale, accepted(), now);
    expect((await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: custom._id }))!.validated).toBe(false);
    await roomEffects(db, job(room, { id: room.hostUserId, username: "host", displayName: "HOST" }, key, now, { purpose: "validate", testsHash: problem.testsHash }), rejected, now);
    expect((await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: custom._id }))!.validated).toBe(false);
    await roomEffects(db, job(room, { id: room.hostUserId, username: "host", displayName: "HOST" }, key, now, { purpose: "validate", testsHash: problem.testsHash }), accepted(), now);
    expect((await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: custom._id }))!.validated).toBe(true);
    const edited = await createCustomProblem(db, room, room.hostUserId, customInput({ title: "Second" }), now);
    await db.collection<CustomProblemDoc>("custom_problems").updateOne({ _id: edited._id }, { $set: { validated: true } });
    await updateCustomProblem(db, room, edited._id, { testCases: customInput().testCases.slice().reverse() }, now);
    expect((await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: edited._id }))!.validated).toBe(false);
  });
  it("trims catalog cases for providers with a per-job limit while keeping every example", async () => {
    const { db, room } = await ready("trim");
    const { problem } = await roomJudgeProblem(db, { roomId: room._id, userId: room.hostUserId, refKey: (await listRoomProblems(db, room._id))[1].refKey, language: "javascript", mode: "submit", maxCases: 8 });
    expect(problem.cases.length).toBeLessThanOrEqual(8);
    expect(problem.cases.some(item => !item.hidden) && problem.cases.some(item => item.hidden)).toBe(true);
    expect(fitCases(problem, 3).cases.length).toBeLessThanOrEqual(3);
    await expect(roomJudgeProblem(db, { roomId: room._id, userId: room.hostUserId, refKey: (await listRoomProblems(db, room._id))[1].refKey, language: "java", mode: "run" })).rejects.toMatchObject({ status: 400 });
  });
});

describe("room judging, standings and isolation", () => {
  it("records a solve exactly once when many finalizers race, and counts each distinct attempt", async () => {
    const { db, room, customKey } = await ready("race");
    await members(db, room, ["r"]);
    const who = person("r"), at = new Date();
    const same = job(room, who, customKey, at);
    await Promise.all(Array.from({ length: 12 }, () => roomEffects(db, same, accepted(), at)));
    await Promise.all(Array.from({ length: 4 }, () => roomEffects(db, job(room, who, customKey, new Date(at.getTime() + 5_000)), accepted(), at)));
    const solve = (await db.collection("room_solves").find({ roomId: room._id, userId: who.id }).toArray());
    expect(solve).toHaveLength(1);
    expect(solve[0].firstAcceptedAt).toEqual(at);
    expect(solve[0].attemptCount).toBe(5);
    const stats = await db.collection("room_stats").find({ roomId: room._id, userId: who.id }).toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].solved).toBe(1);
    expect(await db.collection("room_submissions").countDocuments({ roomId: room._id, userId: who.id })).toBe(5);
  });
  it("counts two different problems finishing at the same moment", async () => {
    const { db, room, customKey, catalogKey } = await ready("two-at-once");
    await members(db, room, ["t"]);
    const who = person("t"), at = new Date();
    await Promise.all([roomEffects(db, job(room, who, customKey, at), accepted(), at), roomEffects(db, job(room, who, catalogKey, new Date(at.getTime() + 1)), accepted(), at)]);
    expect((await db.collection("room_stats").findOne({ roomId: room._id, userId: who.id }))!.solved).toBe(2);
  });
  it("keeps room results out of every global stat and solve collection", async () => {
    const { db, room, customKey } = await ready("isolation");
    await members(db, room, ["g"]);
    await roomEffects(db, job(room, person("g"), customKey, new Date()), accepted(), new Date());
    for (const name of ["user_stats", "language_stats", "solves", "submissions", "progress"]) expect(await db.collection(name).countDocuments(), name).toBe(0);
    expect(await db.collection("room_stats").countDocuments({ roomId: room._id })).toBe(1);
  });
  it("ignores late results from removed members and from ended rooms, and blocks new submissions", async () => {
    const { db, room, now, customKey } = await ready("ended");
    await members(db, room, ["e", "k"]);
    await kickMember(db, room, person("k").id, now);
    await roomEffects(db, job(room, person("k"), customKey, new Date()), accepted(), new Date());
    expect(await db.collection("room_stats").countDocuments({ roomId: room._id, userId: person("k").id })).toBe(0);
    await endRoom(db, room, now);
    await roomEffects(db, job(room, person("e"), customKey, new Date(now.getTime() + 1000)), accepted(), new Date(now.getTime() + 1000));
    expect(await db.collection("room_stats").countDocuments({ roomId: room._id, userId: person("e").id })).toBe(0);
    await expect(roomJudgeProblem(db, { roomId: room._id, userId: person("e").id, refKey: customKey, language: "python", mode: "submit" })).rejects.toMatchObject({ status: 409 });
    await expect(roomJudgeProblem(db, { roomId: room._id, userId: person("k").id, refKey: customKey, language: "python", mode: "run" })).rejects.toMatchObject({ status: 404 });
    await expect(addCatalogProblem(db, room, catalogId(), now)).rejects.toMatchObject({ status: 409 });
    expect((await memberContext(db, room.code, person("e").id, now)).status).toBe("ended");
  });
  it("schedules every room document for deletion 90 days after the room ends", async () => {
    const { db, room, now } = await ready("purge");
    await members(db, room, ["z"]);
    const ended = await endRoom(db, room, now);
    const expected = new Date(now.getTime() + 90 * 86_400_000);
    expect(ended.purgeAt).toEqual(expected);
    for (const name of ["room_members", "room_problems", "custom_problems"]) expect(await db.collection(name).countDocuments({ roomId: room._id, purgeAt: expected }), name).toBeGreaterThan(0);
    expect((await endRoom(db, ended, new Date(now.getTime() + 5000))).purgeAt).toEqual(expected);
    const auto = await setup("auto-end", { endsAt: new Date(Date.now() + 60_000).toISOString() });
    const later = new Date(Date.now() + 120_000);
    expect((await memberContext(auto.db, auto.room.code, auto.host.id, later)).status).toBe("ended");
    expect((await auto.db.collection<RoomDoc>("rooms").findOne({ _id: auto.room._id }))!.status).toBe("ended");
  });
  it("ranks by solved then earlier finish, paginates with a cursor and reports time since the room started", async () => {
    const { db, room, customKey, catalogKey } = await ready("board");
    await members(db, room, ["a", "b", "c", "d"]);
    const start = room.createdAt.getTime(), at = (seconds: number) => new Date(start + seconds * 1000);
    const solve = (who: string, key: string, seconds: number) => roomEffects(db, job(room, person(who), key, at(seconds)), accepted(), at(seconds));
    await solve("a", customKey, 10); await solve("a", catalogKey, 50);
    await solve("b", customKey, 5); await solve("b", catalogKey, 40);
    await solve("c", customKey, 3);
    const first = await roomLeaderboard(db, room, person("c").id, { limit: 2 });
    expect(first.rows.map(row => [row.rank, row.username, row.solved])).toEqual([[1, "b", 2], [2, "a", 2]]);
    expect(first.rows[0].elapsedMs).toBe(40_000);
    expect(first.nextCursor).toBeTruthy();
    expect(first.you).toMatchObject({ rank: 3, username: "c", isYou: true });
    const second = await roomLeaderboard(db, room, person("d").id, { limit: 2, cursor: first.nextCursor! });
    expect(second.rows.map(row => [row.rank, row.username])).toEqual([[3, "c"]]);
    expect(second.nextCursor).toBeNull();
    expect(second.you).toBeNull();
    await expect(roomLeaderboard(db, room, "x", { limit: 2, cursor: "bad" })).rejects.toMatchObject({ status: 400 });
    expect(JSON.stringify(first)).not.toContain("userId");
    const mine = await roomMe(db, room, person("a").id);
    expect(mine).toMatchObject({ rank: 2, solved: 2 });
    expect(mine.problems.map(item => item.status)).toEqual(["solved", "solved"]);
    const none = await roomMe(db, room, person("d").id);
    expect(none.problems.map(item => item.status)).toEqual(["not_attempted", "not_attempted"]);
    await roomEffects(db, job(room, person("d"), catalogKey, at(60)), rejected, at(60));
    expect((await roomMe(db, room, person("d").id)).problems[1].status).toBe("attempted");
  });
});
