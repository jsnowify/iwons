import "server-only";
import { z } from "zod";
import type { Db, Filter, Sort } from "mongodb";
import { languageKey } from "../judge0/contracts";
import { JudgeError } from "../judge0/errors";
import type { StatsDoc, UserDoc } from "./accounts";
import type { Leaderboard } from "../accounts/leaderboard-contract";

export const leaderboardQuery = z.object({ scope: z.enum(["global", "language"]).default("global"), language: languageKey.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().max(1024).optional() }).refine(input => input.scope !== "language" || !!input.language, "Choose a language.");
const cursorSchema = z.object({ solved: z.number().int().nonnegative(), points: z.number().nonnegative(),
  at: z.iso.datetime(), handle: z.string().regex(/^[a-z0-9_]{3,20}$/) }).strict();
const ordering: Sort = { solved: -1, points: -1, lastSolvedAt: 1, handle: 1 };
type Position = Pick<StatsDoc, "solved" | "points" | "lastSolvedAt" | "handle">;
export function aheadOf(row: Position): Filter<StatsDoc> {
  return { $or: [ { solved: { $gt: row.solved } }, { solved: row.solved, points: { $gt: row.points } },
    { solved: row.solved, points: row.points, lastSolvedAt: { $lt: row.lastSolvedAt } },
    { solved: row.solved, points: row.points, lastSolvedAt: row.lastSolvedAt, handle: { $lt: row.handle } } ] };
}
function after(row: Position): Filter<StatsDoc> {
  return { $or: [ { solved: { $lt: row.solved } }, { solved: row.solved, points: { $lt: row.points } },
    { solved: row.solved, points: row.points, lastSolvedAt: { $gt: row.lastSolvedAt } },
    { solved: row.solved, points: row.points, lastSolvedAt: row.lastSolvedAt, handle: { $gt: row.handle } } ] };
}
const publicRow = (row: StatsDoc, rank: number) => ({ rank, handle: row.handle, avatar: row.avatar, solved: row.solved, points: row.points });
export async function leaderboard(db: Db, input: z.infer<typeof leaderboardQuery>, user: UserDoc | null): Promise<Leaderboard> {
  const collection = db.collection<StatsDoc>(input.scope === "language" ? "language_stats" : "user_stats");
  const base: Filter<StatsDoc> = { leaderboardOptIn: true, solved: { $gt: 0 }, ...(input.scope === "language" ? { language: input.language } : {}) };
  let cursor: Position | undefined;
  if (input.cursor) {
    try {
      const value = cursorSchema.parse(JSON.parse(Buffer.from(input.cursor, "base64url").toString("utf8")));
      cursor = { solved: value.solved, points: value.points, lastSolvedAt: new Date(value.at), handle: value.handle };
    } catch { throw new JudgeError(400, "This leaderboard page link is invalid. Start from the first page."); }
  }
  const rows = await collection.find(cursor ? { $and: [base, after(cursor)] } : base).sort(ordering).limit(input.limit + 1).toArray();
  const hasMore = rows.length > input.limit;
  if (hasMore) rows.pop();
  const start = rows.length ? await collection.countDocuments({ $and: [base, aheadOf(rows[0])] }) + 1 : 1;
  const ownDoc = user?.leaderboardOptIn ? await collection.findOne({ ...base, userId: user._id }) : null;
  const own = ownDoc ? publicRow(ownDoc, await collection.countDocuments({ $and: [base, aheadOf(ownDoc)] }) + 1) : null;
  const last = rows.at(-1);
  return { rows: rows.map((row, index) => publicRow(row, start + index)), own,
    nextCursor: hasMore && last ? Buffer.from(JSON.stringify({ solved: last.solved, points: last.points,
      at: last.lastSolvedAt.toISOString(), handle: last.handle })).toString("base64url") : null };
}
