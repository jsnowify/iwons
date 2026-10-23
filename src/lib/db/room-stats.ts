import "server-only";
import type { Db, Filter } from "mongodb";
import { z } from "zod";
import { JudgeError } from "../judge0/errors";
import type { PublicJudgeResult } from "../judge0/contracts";
import type { JudgeJob } from "./judge-repository";
import { ROOM_LIMITS } from "../rooms/contracts";
import { effectiveStatus, type CustomProblemDoc, type MemberDoc, type RoomDoc, type RoomProblemDoc, type RoomSolveDoc, type RoomStatsDoc, type RoomSubmissionDoc } from "./rooms";

const day = 86_400_000;
const solveKey = (job: JudgeJob) => ({ roomId: job.roomId!, userId: job.userId!, problemRefKey: job.problemRefKey! });

/**
 * Applies a finished room job. Everything here is a single-document atomic write and safe to replay:
 * a crash or a concurrent poll can run it again without double counting. Room results never touch the
 * global solves, user_stats or language_stats collections.
 */
export async function roomEffects(db: Db, job: JudgeJob, result: PublicJudgeResult, now = new Date()) {
  const { roomId, userId } = job;
  if (!roomId || !userId || !job.problemRefKey || result.failureSource === "platform" || result.verdict === "internal_error") return;
  const room = await db.collection<RoomDoc>("rooms").findOne({ _id: roomId });
  if (!room) return;
  if (job.purpose === "validate") {
    // The reference must pass every case, and only against the exact tests it was run with.
    if (room.hostUserId === userId && result.verdict === "accepted" && result.passed === result.total)
      await db.collection<CustomProblemDoc>("custom_problems").updateOne({ _id: job.problemRefKey.slice(2), roomId, testsHash: job.testsHash },
        { $set: { validated: true, updatedAt: now } });
    return;
  }
  const at = job.finalizedAt ?? job.createdAt;
  // Closed rooms and removed members record nothing, even if the job finished late.
  if (effectiveStatus(room, at) !== "active" || (room.startsAt && room.startsAt > at)) return;
  const member = await db.collection<MemberDoc>("room_members").findOne({ roomId, userId, status: "active" });
  if (!member) return;
  const audit = await db.collection<RoomSubmissionDoc>("room_submissions").updateOne({ _id: job._id }, { $setOnInsert: {
    roomId, userId, problemRefKey: job.problemRefKey, verdict: result.verdict, passed: result.passed, total: result.total, createdAt: at,
    expiresAt: new Date(at.getTime() + ROOM_LIMITS.auditDays * day) } }, { upsert: true });
  const solves = db.collection<RoomSolveDoc>("room_solves");
  const key = solveKey(job);
  await solves.updateOne(key, { $setOnInsert: { firstAcceptedAt: null, lastAcceptedAt: null, attemptCount: 0 } }, { upsert: true }).catch(error => {
    if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
  });
  // Only the first sight of this job counts as an attempt; replays are free.
  if (audit.upsertedCount === 1) await solves.updateOne(key, { $inc: { attemptCount: 1 } });
  if (result.verdict !== "accepted") return;
  // Matching firstAcceptedAt: null makes the first accept atomic: concurrent finalizers cannot both win.
  const first = await solves.findOneAndUpdate({ ...key, firstAcceptedAt: null }, { $set: { firstAcceptedAt: at, lastAcceptedAt: at, language: job.language },
    $min: { bestRuntimeMs: result.runtimeMs } });
  if (!first) await solves.updateOne({ ...key, firstAcceptedAt: { $ne: null } }, { $max: { lastAcceptedAt: at }, $min: { bestRuntimeMs: result.runtimeMs } });
  await recomputeStanding(db, room._id, member, now);
}

/** Standing is derived from the member's own solve rows, so a replay also repairs a half-written one. */
export async function recomputeStanding(db: Db, roomId: string, member: Pick<MemberDoc, "userId" | "username" | "displayNameSnapshot">, now: Date) {
  const rows = await db.collection<RoomSolveDoc>("room_solves").find({ roomId, userId: member.userId, firstAcceptedAt: { $ne: null } })
    .project<{ firstAcceptedAt: Date }>({ firstAcceptedAt: 1 }).limit(ROOM_LIMITS.maxProblems).toArray();
  if (!rows.length) return;
  const last = rows.reduce((latest, row) => (row.firstAcceptedAt > latest ? row.firstAcceptedAt : latest), rows[0].firstAcceptedAt);
  // $max keeps the standing monotonic, so two problems finishing at once cannot overwrite each other with a stale count.
  await db.collection<RoomStatsDoc>("room_stats").updateOne({ roomId, userId: member.userId },
    { $max: { solved: rows.length, lastAcceptedAt: last }, $set: { username: member.username, displayName: member.displayNameSnapshot, updatedAt: now } }, { upsert: true });
}

const cursorSchema = z.object({ s: z.number().int().positive(), t: z.iso.datetime(), u: z.string().min(1).max(100) }).strict();
type Position = { solved: number; lastAcceptedAt: Date; userId: string };
const ahead = (row: Position): Filter<RoomStatsDoc> => ({ $or: [{ solved: { $gt: row.solved } }, { solved: row.solved, lastAcceptedAt: { $lt: row.lastAcceptedAt } },
  { solved: row.solved, lastAcceptedAt: row.lastAcceptedAt, userId: { $lt: row.userId } }] });
const behind = (row: Position): Filter<RoomStatsDoc> => ({ $or: [{ solved: { $lt: row.solved } }, { solved: row.solved, lastAcceptedAt: { $gt: row.lastAcceptedAt } },
  { solved: row.solved, lastAcceptedAt: row.lastAcceptedAt, userId: { $gt: row.userId } }] });
const startOf = (room: RoomDoc) => (room.startsAt ?? room.createdAt).getTime();
const present = (room: RoomDoc, row: RoomStatsDoc, rank: number, you: boolean) => ({ rank, username: row.username, displayName: row.displayName, solved: row.solved,
  lastAcceptedAt: row.lastAcceptedAt?.toISOString() ?? null, elapsedMs: row.lastAcceptedAt ? Math.max(0, row.lastAcceptedAt.getTime() - startOf(room)) : null, isYou: you });

/** Solved descending, then the earlier finisher first. Served by the (roomId, solved, lastAcceptedAt, userId) index. */
export async function roomLeaderboard(db: Db, room: RoomDoc, userId: string, input: { limit: number; cursor?: string }) {
  const stats = db.collection<RoomStatsDoc>("room_stats");
  const base: Filter<RoomStatsDoc> = { roomId: room._id, solved: { $gt: 0 } };
  let after: Position | undefined;
  if (input.cursor) {
    try { const value = cursorSchema.parse(JSON.parse(Buffer.from(input.cursor, "base64url").toString("utf8"))); after = { solved: value.s, lastAcceptedAt: new Date(value.t), userId: value.u }; }
    catch { throw new JudgeError(400, "This leaderboard page link is invalid. Start from the first page."); }
  }
  const rows = await stats.find(after ? { $and: [base, behind(after)] } : base).sort({ solved: -1, lastAcceptedAt: 1, userId: 1 }).limit(input.limit + 1).toArray();
  const more = rows.length > input.limit;
  if (more) rows.pop();
  const first = rows[0], start = first?.lastAcceptedAt ? await stats.countDocuments({ $and: [base, ahead({ solved: first.solved, lastAcceptedAt: first.lastAcceptedAt, userId: first.userId })] }) + 1 : 1;
  const own = await stats.findOne({ roomId: room._id, userId });
  const ownRank = own?.lastAcceptedAt && own.solved > 0 ? await stats.countDocuments({ $and: [base, ahead({ solved: own.solved, lastAcceptedAt: own.lastAcceptedAt, userId })] }) + 1 : null;
  const last = rows.at(-1);
  return { rows: rows.map((row, index) => present(room, row, start + index, row.userId === userId)),
    you: own && ownRank ? present(room, own, ownRank, true) : null,
    nextCursor: more && last?.lastAcceptedAt ? Buffer.from(JSON.stringify({ s: last.solved, t: last.lastAcceptedAt.toISOString(), u: last.userId })).toString("base64url") : null };
}

export async function roomMe(db: Db, room: RoomDoc, userId: string) {
  const [problems, solves, board] = await Promise.all([
    db.collection<RoomProblemDoc>("room_problems").find({ roomId: room._id }).sort({ order: 1 }).limit(ROOM_LIMITS.maxProblems).toArray(),
    db.collection<RoomSolveDoc>("room_solves").find({ roomId: room._id, userId }).limit(ROOM_LIMITS.maxProblems).toArray(),
    roomLeaderboard(db, room, userId, { limit: 1 }),
  ]);
  const bySolve = new Map(solves.map(item => [item.problemRefKey, item]));
  return { rank: board.you?.rank ?? null, solved: board.you?.solved ?? 0, lastAcceptedAt: board.you?.lastAcceptedAt ?? null, elapsedMs: board.you?.elapsedMs ?? null,
    problems: problems.map(problem => {
      const solve = bySolve.get(problem.refKey);
      return { refKey: problem.refKey, status: solve?.firstAcceptedAt ? "solved" as const : solve && solve.attemptCount > 0 ? "attempted" as const : "not_attempted" as const,
        firstAcceptedAt: solve?.firstAcceptedAt?.toISOString() ?? null,
        elapsedMs: solve?.firstAcceptedAt ? Math.max(0, solve.firstAcceptedAt.getTime() - startOf(room)) : null, attempts: solve?.attemptCount ?? 0 };
    }) };
}
