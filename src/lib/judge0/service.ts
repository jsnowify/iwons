import "server-only";
import { randomBytes } from "node:crypto";
import type { JudgeRepository, JudgeJob, JudgeProblem } from "../db/judge-repository";
import type { JudgeClient } from "./client";
import { encoded } from "./client";
import { judgeRequest, type JudgeRequest, type PublicJudgeResult } from "./contracts";
import { RATE_WINDOWS, rateLimitAll } from "../db/judge-repository";
import { memoryRateLimit } from "../ratelimit/memory";
import { JudgeError } from "./errors";
import { resolveLanguage } from "./languages";
import { clampLimits, instanceLimits } from "./limits";
import { grade } from "./results";

export interface RoomProblemRequest { roomId: string; userId: string; refKey: string; language: JudgeRequest["language"]; mode: JudgeRequest["mode"];
  purpose?: "validate"; maxCases?: number }
export function judgeService(repo: JudgeRepository, client: JudgeClient,
  accountEffects?: (job: JudgeJob, result: PublicJudgeResult) => Promise<void>,
  roomProblem?: (input: RoomProblemRequest) => Promise<JudgeProblem>) {
  async function finish(job: JudgeJob, result: PublicJudgeResult) {
    if (result.failureSource === "platform") {
      await repo.refundAttempt?.(job);
      return { state: "done" as const, result };
    }
    if (job.userId && job.mode === "submit" && !job.effectsDone && accountEffects) {
      const lease = repo.claimEffects ? await repo.claimEffects(job._id) : "local";
      if (!lease) return { state: "running" as const, done: job.tokens.length, total: job.tokens.length };
      try {
        await accountEffects(job, result);
        await repo.effectsDone?.(job._id, lease);
      } catch (error) {
        await repo.releaseEffects?.(job._id, lease);
        if (error instanceof JudgeError && error.status === 409)
          return { state: "running" as const, done: job.tokens.length, total: job.tokens.length };
        throw error;
      }
    }
    return { state: "done" as const, result };
  }
  return {
    async create(input: JudgeRequest, ipHash: string, userId: string | null = null, options: { purpose?: "validate" } = {}) {
      const body = judgeRequest.parse(input);
      const attemptAt = new Date();
      const perMinute = body.mode === "submit" ? 5 : 10;
      await rateLimitAll(repo, [{ key: `${body.mode}:${ipHash}`, limit: perMinute }, ...(userId ? [{ key: `${body.mode}:user:${userId}`, limit: perMinute }] : [])], attemptAt.getTime());
      let problem: JudgeProblem | null;
      if (body.roomId) {
        if (!userId) throw new JudgeError(401, "Sign in to use your private room.");
        if (!roomProblem) throw new JudgeError(404, "Private rooms are not available.");
        problem = await roomProblem({ roomId: body.roomId, userId, refKey: body.problemId, language: body.language, mode: body.mode,
          ...(options.purpose ? { purpose: options.purpose } : {}), ...(client.maxCases ? { maxCases: client.maxCases } : {}) });
      } else problem = await repo.problem(body.problemId);
      if (!problem) throw new JudgeError(404, "This problem is not available for server judging.");
      if (body.language === "java" && !/\bpublic\s+class\s+Main\b/.test(body.code))
        throw new JudgeError(400, "Use public class Main with a main method for this stdin/stdout problem.");
      const cases = problem.cases.filter(item => body.mode === "submit" || !item.hidden);
      if (!cases.length) throw new JudgeError(400, "This problem has no visible examples to run.");
      if (client.maxCases && cases.length > client.maxCases)
        throw new JudgeError(400, "This free runner supports up to eight test cases per job.");
      // Daily execution budgets (one per test case) keep a single person or address from using up the shared provider quota.
      // Signed-in people get their own budget; the address budget is far larger for them so a classroom can share one network.
      await rateLimitAll(repo, [{ key: `exec:ip:${ipHash}`, limit: userId ? 6000 : 1500, cost: cases.length, windowMs: RATE_WINDOWS.day },
        ...(userId ? [{ key: `exec:user:${userId}`, limit: 600, cost: cases.length, windowMs: RATE_WINDOWS.day }] : [])]);
      if (client.accountRunsPerMinute) await repo.rateLimit(`provider:${client.cacheNamespace}`, client.accountRunsPerMinute, Date.now(), cases.length);
      const [languageId, max] = await Promise.all([resolveLanguage(body.language, client, repo), instanceLimits(client, repo)]);
      const size = Math.min(20, max.max_submission_batch_size);
      const tokens: string[] = [];
      for (let start = 0; start < cases.length; start += size) {
        tokens.push(...await client.submit(cases.slice(start, start + size).map(item => ({
          source_code: encoded(problem.wrap ? problem.wrap(body.language, body.code) : body.code), stdin: encoded(item.stdin), expected_output: encoded(item.expected),
          language_id: languageId, ...clampLimits(body.language, max),
        }))));
      }
      const id = randomBytes(32).toString("hex");
      const room = body.roomId ? { problemRefKey: body.problemId, ...(options.purpose ? { purpose: options.purpose } : {}),
        ...(problem.testsHash ? { testsHash: problem.testsHash } : {}) } : {};
      await repo.create({ _id: id, ...body, ...room, userId, ipHash, tokens, effectsDone: false, attemptAt,
        caseRefs: cases.map(({ id, hidden }) => ({ id, hidden })), expected: cases.map(item => item.expected),
        createdAt: new Date(), expiresAt: new Date(Date.now() + 3_600_000), finalizedAt: null, canceledAt: null, result: null });
      return { jobId: id };
    },
    async poll(id: string, ipHash: string, userId: string | null = null) {
      const job = await repo.job(id);
      if (!job || (job.userId ? job.userId !== userId : job.ipHash !== ipHash)) throw new JudgeError(404, "This judge job was not found or has expired.");
      if (job.canceledAt) return { state: "canceled" as const };
      if (job.result) return finish(job, job.result);
      // Polling is a read: a per-instance soft guard, keyed by account when signed in, otherwise by address.
      memoryRateLimit(userId ? `poll:user:${userId}` : `poll:${ipHash}`, 180);
      const submissions = [];
      for (let start = 0; start < job.tokens.length; start += 20) submissions.push(...await client.read(job.tokens.slice(start, start + 20)));
      const done = submissions.filter(item => item.status_id >= 3).length;
      if (done !== submissions.length) return { state: "running" as const, done, total: submissions.length };
      const result = grade(job, submissions);
      await repo.finalize(id, result);
      const finalized: JudgeJob | null = await repo.job(id);
      if (finalized?.canceledAt) return { state: "canceled" as const };
      if (!finalized?.result) throw new JudgeError(503, "Your result is being saved. Please retry.");
      // Recover an interrupted winning request using stable submission IDs and
      // per-problem projection ledgers; retries cannot increment counts twice.
      return finish(finalized, finalized.result);
    },
    async cancel(id: string, ipHash: string, userId: string | null = null) {
      await repo.rateLimit(`cancel:${ipHash}`, 60);
      const job = await repo.job(id);
      if (!job || (job.userId ? job.userId !== userId : job.ipHash !== ipHash)) throw new JudgeError(404, "This judge job was not found or has expired.");
      await repo.cancel(id);
      const saved = await repo.job(id);
      if (saved?.result) {
        await finish(saved, saved.result);
        return { state: "done" as const, alreadyFinished: true as const, result: saved.result };
      }
      if (saved?.canceledAt) return { state: "canceled" as const, alreadyFinished: false as const };
      throw new JudgeError(404, "This judge job was not found or has expired.");
    },
  };
}
