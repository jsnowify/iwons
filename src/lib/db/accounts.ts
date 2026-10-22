import "server-only";
import { randomUUID } from "node:crypto";
import type { Db, Document } from "mongodb";
import type { AccountUser, AccountProgress, ProgressPatch } from "../accounts/contracts";
import { mergeProgress } from "../accounts/contracts";
import { filterImportablePayload } from "../accounts/importable";
import { JudgeError } from "../judge0/errors";
import type { PublicJudgeResult, JudgeLanguage } from "../judge0/contracts";
import { createCredentialUserIndexes } from "./credential-user-indexes";
import type { CredentialUserDoc } from "./credential-users";
import { avatarUrl } from "../accounts/avatar-policy";
import type { CurrentCredential } from "../accounts/current-credential";

export interface UserDoc {
  _id: string; email: string; name: string; handle?: string; image: string;
  leaderboardOptIn: boolean; createdAt: Date; provider?: string; subject?: string;
  username?: string; displayName?: string; avatarVersion?: string;
  lock?: { owner: string; expiresAt: Date };
}
interface ProgressDoc extends AccountProgress { _id: string; userId: string }
export interface SolveDoc { _id: string; userId: string; problemId: string; languages: JudgeLanguage[];
  firstSolvedAt: Date; lastSolvedAt: Date; bestRuntimeMs?: number; verified: boolean; source: "judged" | "imported" }
export interface StatsDoc { _id: string; userId: string; handle: string; avatar: string; leaderboardOptIn: boolean;
  solved: number; points: number; lastSolvedAt: Date; problemIds: string[]; language?: JudgeLanguage }
export interface ServerSubmission { _id: string; userId: string; problemId: string; language: JudgeLanguage;
  verdict: PublicJudgeResult["verdict"]; passed: number; total: number; runtimeMs: number; memoryKb: number; code: string; createdAt: Date }
const emptyProgress = (): AccountProgress => ({ drafts: {}, preferences: {}, foundationProgress: {}, unverifiedSolves: [], updatedAt: 0 });
export const accountScopeId = (user: UserDoc) => user.username ? `credential-${Buffer.from(user.username).toString("hex")}` : user._id;
export function accountView(user: UserDoc | CredentialUserDoc | CurrentCredential): UserDoc {
  if (!("username" in user) || !user.username) return user as UserDoc;
  return { _id: user._id, username: user.username, displayName: user.displayName!, email: user.email,
    name: user.displayName!, handle: user.username, image: (Array.from(user.displayName!)[0] ?? "I").toUpperCase(),
    leaderboardOptIn: false, createdAt: user.createdAt, avatarVersion: user.avatarVersion };
}
export const publicUser = (user: UserDoc): AccountUser => ({ id: accountScopeId(user), name: user.name,
  handle: user.handle ?? null, avatar: user.image, leaderboardOptIn: user.leaderboardOptIn,
  ...(user.avatarVersion ? { avatarUrl: avatarUrl(user.avatarVersion) } : {}) });
async function duplicateSafe(update: () => Promise<unknown>) {
  try { await update(); } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
    await update();
  }
}
export async function accountLock<T>(db: Db, userId: string, action: (user: UserDoc) => Promise<T>): Promise<T> {
  const owner = randomUUID();
  const users = db.collection<UserDoc>("users");
  const user = await users.findOneAndUpdate({ _id: userId,
    $or: [{ lock: { $exists: false } }, { "lock.expiresAt": { $lt: new Date() } }] },
  { $set: { lock: { owner, expiresAt: new Date(Date.now() + 90_000) } } }, { returnDocument: "after" });
  if (!user) throw new JudgeError(409, "Your account is updating. Please try again shortly.");
  try { return await action(accountView(user)); }
  finally { await users.updateOne({ _id: userId, "lock.owner": owner }, { $unset: { lock: "" } }); }
}
export function accounts(db: Db) {
  const users = db.collection<UserDoc>("users");
  return {
    user: async (id: string) => { const user = await users.findOne({ _id: id }, { projection: { passwordHash: 0 } }); return user ? accountView(user) : null; },
    async oauth(provider: string, subject: string, email: string, name: string) {
      const existing = await users.findOne({ provider, subject });
      if (existing) return existing._id;
      // Never silently link another provider by matching its email address.
      const user: UserDoc = { _id: randomUUID(), provider, subject, email: email.toLowerCase(), name: name.slice(0, 80),
        image: (Array.from(name)[0] ?? "I").toUpperCase(), leaderboardOptIn: false, createdAt: new Date() };
      try { await users.insertOne(user); return user._id; }
      catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
        const raced = await users.findOne({ provider, subject });
        if (!raced) throw new JudgeError(409, "Use the provider you originally signed up with.");
        return raced._id;
      }
    },
    async progress(userId: string): Promise<AccountProgress> {
      const doc = await db.collection<ProgressDoc>("progress").findOne({ _id: userId });
      const solves = await db.collection<SolveDoc>("solves").find({ userId }).limit(5000).toArray();
      return { ...(doc ? { drafts: doc.drafts, preferences: doc.preferences, foundationProgress: doc.foundationProgress, updatedAt: doc.updatedAt } : emptyProgress()),
        unverifiedSolves: solves.map(item => ({ problemId: item.problemId, languages: item.languages,
          firstSolvedAt: item.firstSolvedAt.getTime(), bestRuntimeMs: item.bestRuntimeMs })) };
    },
    async merge(userId: string, input: ProgressPatch, published: ReadonlySet<string>) {
      input = filterImportablePayload(input, published).data;
      return accountLock(db, userId, async () => {
        const current = await this.progress(userId);
        const merged = mergeProgress(current, input);
        if (Buffer.byteLength(JSON.stringify(merged)) > 4_000_000) throw new JudgeError(413, "Account progress is full. Export your data before removing older drafts.");
        await db.collection<ProgressDoc>("progress").replaceOne({ _id: userId }, { userId, ...merged }, { upsert: true });
        const operations = input.unverifiedSolves.map(solve => {
          const at = new Date(Math.min(solve.firstSolvedAt, Date.now()));
          return { updateOne: { filter: { _id: `${userId}:${solve.problemId}` }, update: {
            $setOnInsert: { userId, problemId: solve.problemId, verified: false, source: "imported" as const },
            $addToSet: { languages: { $each: solve.languages } }, $min: { firstSolvedAt: at,
              ...(solve.bestRuntimeMs !== undefined ? { bestRuntimeMs: solve.bestRuntimeMs } : {}) }, $max: { lastSolvedAt: at },
          }, upsert: true } };
        });
        if (operations.length) await db.collection<SolveDoc>("solves").bulkWrite(operations, { ordered: false });
        return this.progress(userId);
      });
    },
    async update(userId: string, patch: { handle?: string; leaderboardOptIn?: boolean }) {
      return accountLock(db, userId, async user => {
        const handle = patch.handle ?? user.handle;
        if (patch.leaderboardOptIn && !handle) throw new JudgeError(400, "Choose a handle before joining the leaderboard.");
        try { await users.updateOne({ _id: userId }, { $set: patch }); }
        catch (error) {
          if (error instanceof Error && "code" in error && error.code === 11000) throw new JudgeError(409, "That handle is already taken.");
          throw error;
        }
        const fields = { handle: handle ?? "", leaderboardOptIn: patch.leaderboardOptIn ?? user.leaderboardOptIn };
        await Promise.all(["user_stats", "language_stats"].map(name => db.collection<StatsDoc>(name).updateMany({ userId }, { $set: fields })));
        return publicUser({ ...user, ...patch });
      });
    },
    async delete(userId: string) {
      await accountLock(db, userId, async () => {
        await Promise.all(["progress", "solves", "submissions", "user_stats", "language_stats", "judge_jobs"].map(name => db.collection(name).deleteMany({ userId })));
        await users.deleteOne({ _id: userId });
      });
    },
  };
}
// Every projection carries its own per-problem ledger. Replaying after a crash
// repairs partially completed projections without duplicating a counter.
export async function recordJudged(db: Db, input: ServerSubmission, weight: number) {
  if (input.verdict === "internal_error") return;
  return accountLock(db, input.userId, async user => {
    const submissions = db.collection<ServerSubmission>("submissions");
    await submissions.updateOne({ _id: input._id }, { $setOnInsert: input }, { upsert: true });
    if (input.verdict !== "accepted") return;
    await db.collection<SolveDoc>("solves").updateOne({ _id: `${input.userId}:${input.problemId}` }, {
      $set: { verified: true, source: "judged" }, $setOnInsert: { userId: input.userId, problemId: input.problemId },
      $min: { firstSolvedAt: input.createdAt, bestRuntimeMs: input.runtimeMs }, $max: { lastSolvedAt: input.createdAt },
      $addToSet: { languages: input.language },
    }, { upsert: true });
    const repeat = { $in: [input.problemId, { $ifNull: ["$problemIds", []] }] };
    const fields: Document = {
      userId: input.userId, handle: { $literal: user.handle ?? "" }, avatar: { $literal: user.image }, leaderboardOptIn: user.leaderboardOptIn,
      solved: { $add: [{ $ifNull: ["$solved", 0] }, { $cond: [repeat, 0, 1] }] },
      points: { $add: [{ $ifNull: ["$points", 0] }, { $cond: [repeat, 0, weight] }] },
      lastSolvedAt: { $cond: [repeat, "$lastSolvedAt", { $max: [{ $ifNull: ["$lastSolvedAt", input.createdAt] }, input.createdAt] }] },
      problemIds: { $setUnion: [{ $ifNull: ["$problemIds", []] }, [input.problemId]] },
    };
    await duplicateSafe(() => db.collection<StatsDoc>("user_stats").updateOne({ _id: input.userId }, [{ $set: fields }], { upsert: true }));
    await duplicateSafe(() => db.collection<StatsDoc>("language_stats").updateOne({ _id: `${input.userId}:${input.language}` },
      [{ $set: { ...fields, language: input.language } }], { upsert: true }));
  });
}
export async function createAccountIndexes(db: Db) {
  await createCredentialUserIndexes(db);
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ handle: 1 }, { unique: true, sparse: true }),
    db.collection("progress").createIndex({ userId: 1 }, { unique: true }),
    db.collection("solves").createIndex({ userId: 1, problemId: 1 }, { unique: true }),
    db.collection("submissions").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("submissions").createIndex({ userId: 1, problemId: 1 }),
    db.collection("user_stats").createIndex({ leaderboardOptIn: 1, solved: -1, points: -1, lastSolvedAt: 1, handle: 1 }),
    db.collection("user_stats").createIndex({ userId: 1 }, { unique: true }),
    db.collection("language_stats").createIndex({ language: 1, leaderboardOptIn: 1, solved: -1, points: -1, lastSolvedAt: 1, handle: 1 }),
    db.collection("language_stats").createIndex({ userId: 1, language: 1 }, { unique: true }),
  ]);
}
