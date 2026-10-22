import "server-only";
import { randomBytes } from "node:crypto";
import type { JudgeRepository, JudgeJob } from "../db/judge-repository";
import type { JudgeClient } from "./client";
import { encoded } from "./client";
import { judgeRequest, type JudgeRequest, type PublicJudgeResult } from "./contracts";
import { JudgeError } from "./errors";
import { resolveLanguage } from "./languages";
import { clampLimits, instanceLimits } from "./limits";
import { grade } from "./results";

export function judgeService(repo: JudgeRepository, client: JudgeClient,
  accountEffects?: (job: JudgeJob, result: PublicJudgeResult) => Promise<void>) {
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
    async create(input: JudgeRequest, ipHash: string, userId: string | null = null) {
      const body = judgeRequest.parse(input);
      const attemptAt = new Date();
      await repo.rateLimit(`${body.mode}:${ipHash}`, body.mode === "submit" ? 5 : 10, attemptAt.getTime());
      if (userId) await repo.rateLimit(`${body.mode}:user:${userId}`, body.mode === "submit" ? 5 : 10, attemptAt.getTime());
      const problem = await repo.problem(body.problemId);
      if (!problem) throw new JudgeError(404, "This problem is not available for server judging.");
      if (body.language === "java" && !/\bpublic\s+class\s+Main\b/.test(body.code))
        throw new JudgeError(400, "Use public class Main with a main method for this stdin/stdout problem.");
      const cases = problem.cases.filter(item => body.mode === "submit" || !item.hidden);
      if (!cases.length) throw new JudgeError(400, "This problem has no visible examples to run.");
      if (client.maxCases && cases.length > client.maxCases)
        throw new JudgeError(400, "This free runner supports up to eight test cases per job.");
      if (client.accountRunsPerMinute) await repo.rateLimit(`provider:${client.cacheNamespace}`, client.accountRunsPerMinute, Date.now(), cases.length);
      const [languageId, max] = await Promise.all([resolveLanguage(body.language, client, repo), instanceLimits(client, repo)]);
      const size = Math.min(20, max.max_submission_batch_size);
      const tokens: string[] = [];
      for (let start = 0; start < cases.length; start += size) {
        tokens.push(...await client.submit(cases.slice(start, start + size).map(item => ({
          source_code: encoded(body.code), stdin: encoded(item.stdin), expected_output: encoded(item.expected),
          language_id: languageId, ...clampLimits(body.language, max),
        }))));
      }
      const id = randomBytes(32).toString("hex");
      await repo.create({ _id: id, ...body, userId, ipHash, tokens, effectsDone: false, attemptAt,
        caseRefs: cases.map(({ id, hidden }) => ({ id, hidden })), expected: cases.map(item => item.expected),
        createdAt: new Date(), expiresAt: new Date(Date.now() + 3_600_000), finalizedAt: null, canceledAt: null, result: null });
      return { jobId: id };
    },
    async poll(id: string, ipHash: string, userId: string | null = null) {
      const job = await repo.job(id);
      if (!job || (job.userId ? job.userId !== userId : job.ipHash !== ipHash)) throw new JudgeError(404, "This judge job was not found or has expired.");
      if (job.canceledAt) return { state: "canceled" as const };
      if (job.result) return finish(job, job.result);
      await repo.rateLimit(`poll:${ipHash}`, 180);
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
