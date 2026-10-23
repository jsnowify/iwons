import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Db } from "mongodb";
import { languageKey, type JudgeRequest, type PublicJudgeResult } from "../judge0/contracts";
import { JudgeError } from "../judge0/errors";

export const serverProblem = z.object({
  _id: z.string(), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string(),
  published: z.boolean(), format: z.literal("stdin"), difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string(),
  starters: z.object({ java: z.string(), python: z.string(), javascript: z.string() }),
  cases: z.array(z.object({ id: z.string(), stdin: z.string().max(20_000),
    expected: z.string().max(20_000), hidden: z.boolean() })).min(1).max(100),
});
export type ServerProblem = z.infer<typeof serverProblem>;
/** A server problem plus an optional adapter that wraps the learner's code (used for catalog problems in rooms). */
export interface JudgeProblem extends ServerProblem { wrap?: (language: z.infer<typeof languageKey>, code: string) => string; testsHash?: string }
export interface JudgeJob {
  _id: string; tokens: string[]; caseRefs: { id: string; hidden: boolean }[];
  mode: JudgeRequest["mode"]; userId: string | null; ipHash: string;
  language: z.infer<typeof languageKey>; problemId: string; code: string;
  // Immutable grading snapshot: case edits after submission cannot alter a verdict.
  expected: string[]; createdAt: Date; expiresAt: Date;
  attemptAt?: Date;
  finalizedAt: Date | null; result: PublicJudgeResult | null;
  canceledAt?: Date | null;
  effectsDone?: boolean;
  effectsLease?: { owner: string; expiresAt: Date };
  // Private rooms: results are written to the room only, never to global stats.
  roomId?: string; problemRefKey?: string; purpose?: "validate"; testsHash?: string;
}
export interface JudgeRepository {
  problem(id: string): Promise<ServerProblem | null>;
  create(job: JudgeJob): Promise<void>;
  job(id: string): Promise<JudgeJob | null>;
  finalize(id: string, result: PublicJudgeResult): Promise<boolean>;
  cancel(id: string): Promise<void>;
  claimEffects?(id: string): Promise<string | null>;
  effectsDone?(id: string, owner?: string): Promise<void>;
  releaseEffects?(id: string, owner: string): Promise<void>;
  /** Fixed-window counter. `windowMs` defaults to one minute; use RATE_WINDOWS for hour and day budgets. */
  rateLimit(key: string, limit: number, now?: number, cost?: number, windowMs?: number): Promise<void>;
  refundAttempt?(job: JudgeJob): Promise<void>;
  cacheGet(key: string): Promise<unknown>;
  cacheSet(key: string, value: unknown): Promise<void>;
}
interface Cache { _id: string; value: unknown; expiresAt: Date }
interface Bucket { _id: string; count: number; expiresAt: Date }
export const RATE_WINDOWS = Object.freeze({ minute: 60_000, hour: 3_600_000, day: 86_400_000 });
export interface RateBudget { key: string; limit: number; cost?: number; windowMs?: number }
/**
 * Applies several budgets in one round trip instead of one after another. Every budget is charged, and if any is
 * exhausted the request is refused with the longest wait, so the caller is told when it can really try again.
 */
export async function rateLimitAll(repo: Pick<JudgeRepository, "rateLimit">, budgets: RateBudget[], now = Date.now()) {
  const results = await Promise.allSettled(budgets.map(item => repo.rateLimit(item.key, item.limit, now, item.cost ?? 1, item.windowMs)));
  let worst: JudgeError | undefined;
  for (const result of results) {
    if (result.status === "fulfilled") continue;
    // Anything other than a limit (a database failure) is reported as it is, before limit errors.
    if (!(result.reason instanceof JudgeError) || result.reason.status !== 429) throw result.reason;
    if (!worst || (result.reason.retryAfterSeconds ?? 0) > (worst.retryAfterSeconds ?? 0)) worst = result.reason;
  }
  if (worst) throw worst;
}
export function judgeRepository(db: Db): JudgeRepository {
  const jobs = db.collection<JudgeJob>("judge_jobs");
  return {
    async problem(id) {
      const value = await db.collection<ServerProblem>("judge_problems").findOne({ _id: id, published: true });
      if (!value) return null;
      const parsed = serverProblem.safeParse(value);
      if (!parsed.success) throw new JudgeError(503, "This problem could not be loaded. Please try again.");
      return parsed.data;
    },
    async create(job) { await jobs.insertOne(job); },
    async job(id) { return jobs.findOne({ _id: id, expiresAt: { $gt: new Date() } }); },
    async finalize(id, result) {
      const won = await jobs.findOneAndUpdate({ _id: id, finalizedAt: null, canceledAt: null },
        { $set: { finalizedAt: new Date(), result } }, { returnDocument: "after" });
      return won !== null;
    },
    async cancel(id) {
      await jobs.findOneAndUpdate({ _id: id, finalizedAt: null, canceledAt: null, expiresAt: { $gt: new Date() } },
        { $set: { canceledAt: new Date() } });
    },
    async claimEffects(id) {
      const owner = randomUUID();
      const claimed = await jobs.findOneAndUpdate({ _id: id, canceledAt: null, finalizedAt: { $ne: null }, effectsDone: { $ne: true },
        $or: [{ effectsLease: { $exists: false } }, { "effectsLease.expiresAt": { $lt: new Date() } }] },
      { $set: { effectsLease: { owner, expiresAt: new Date(Date.now() + 15_000) } } }, { returnDocument: "after" });
      return claimed ? owner : null;
    },
    async effectsDone(id, owner) { await jobs.updateOne({ _id: id, ...(owner ? { "effectsLease.owner": owner } : {}) },
      { $set: { effectsDone: true }, $unset: { effectsLease: "" } }); },
    async releaseEffects(id, owner) { await jobs.updateOne({ _id: id, "effectsLease.owner": owner }, { $unset: { effectsLease: "" } }); },
    async rateLimit(key, limit, now = Date.now(), cost = 1, windowMs = 60_000) {
      // The window length is part of the key so a minute and an hour budget for the same name never mix.
      const bucket = `${key}:${windowMs === 60_000 ? "" : `${windowMs}:`}${Math.floor(now / windowMs)}`;
      const collection = db.collection<Bucket>("judge_rate_limits");
      let value: Bucket | null;
      try {
        value = await collection.findOneAndUpdate({ _id: bucket },
          { $inc: { count: cost }, $setOnInsert: { expiresAt: new Date(now + 2 * windowMs) } },
          { upsert: true, returnDocument: "after" });
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
        value = await collection.findOneAndUpdate({ _id: bucket }, { $inc: { count: cost } }, { returnDocument: "after" });
      }
      if (!value || value.count > limit) {
        // Log once per bucket, when the limit is first crossed, so an attack cannot flood the logs. The key holds only
        // a hashed identifier, and only the name of the budget is written.
        if (value && value.count - cost <= limit) console.warn("[rate-limit] blocked", { budget: key.split(":").slice(0, 2).join(":"), window: windowMs, limit });
        const wait = Math.max(1, Math.ceil(((Math.floor(now / windowMs) + 1) * windowMs - now) / 1000));
        throw new JudgeError(429, windowMs >= RATE_WINDOWS.day ? "You’ve reached today’s limit for this. It resets within 24 hours."
          : windowMs >= RATE_WINDOWS.hour ? "You’ve reached the hourly limit for this. Please try again later." : "Too many requests. Please wait a minute and try again.", wait);
      }
    },
    async refundAttempt(job) {
      const window = Math.floor((job.attemptAt ?? job.createdAt).getTime() / 60_000);
      const keys = [`${job.mode}:${job.ipHash}`, ...(job.userId ? [`${job.mode}:user:${job.userId}`] : [])];
      for (const key of keys) await db.collection<Bucket & { refunds?: string[] }>("judge_rate_limits")
        .updateOne({ _id: `${key}:${window}`, count: { $gt: 0 }, refunds: { $ne: job._id } },
          { $inc: { count: -1 }, $addToSet: { refunds: job._id } });
    },
    async cacheGet(key) {
      return (await db.collection<Cache>("judge_cache").findOne({ _id: key, expiresAt: { $gt: new Date() } }))?.value;
    },
    async cacheSet(key, value) {
      await db.collection<Cache>("judge_cache").updateOne({ _id: key },
        { $set: { value, expiresAt: new Date(Date.now() + 3_600_000) } }, { upsert: true });
    },
  };
}
export async function createJudgeIndexes(db: Db) {
  await Promise.all([
    db.collection("judge_jobs").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("judge_jobs").createIndex({ userId: 1, finalizedAt: 1, effectsDone: 1 }),
    db.collection("judge_rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("judge_cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("judge_problems").createIndex({ slug: 1 }, { unique: true }),
  ]);
}
