import "server-only";
import type { Db } from "mongodb";
import type { SolveDoc } from "../db/accounts";
import type { ProgressPatch } from "./contracts";
import { verificationCandidates, type VerificationCandidate } from "./verification-contracts";

export async function importedVerification(db: Db, userId: string) {
  const [solves, progress] = await Promise.all([
    db.collection<SolveDoc>("solves").find({ userId, verified: false, source: "imported" },
      { projection: { problemId: 1, languages: 1, _id: 0 } }).sort({ problemId: 1 }).limit(5000).toArray(),
    db.collection<{ _id: string; drafts: ProgressPatch["drafts"] }>("progress").findOne({ _id: userId }, { projection: { drafts: 1 } }),
  ]);
  const published = await db.collection("judge_problems").aggregate<{ _id: string; title: string; caseCount: number }>([
    { $match: { _id: { $in: solves.map(item => item.problemId) }, published: true, format: "stdin" } },
    { $project: { title: 1, caseCount: { $size: "$cases" } } },
  ]).toArray();
  const problems = new Map(published.map(item => [item._id, item]));
  const capacity = process.env.JUDGE0_PROVIDER === "onlinecompiler" ? 8 : 100;
  const items: VerificationCandidate[] = solves.map(solve => {
    const problem = problems.get(solve.problemId);
    if (!problem || problem.caseCount > capacity) return { problemId: solve.problemId, title: solve.problemId, reason: "unsupported" };
    for (const language of [...new Set([...solve.languages, "java", "python", "javascript"] as const)]) {
      const code = progress?.drafts[`${solve.problemId}_${language}`]?.code;
      if (code?.trim()) return { problemId: solve.problemId, title: problem.title, reason: "ready", language, code };
    }
    return { problemId: solve.problemId, title: problem.title, reason: "missing_code" };
  });
  // Bound pending cases, not just requests. The free provider has eight queue
  // slots; CE defaults to 100. Other users can still fill it: normal busy/rate
  // responses pause the client queue rather than spinning or holding a worker.
  const largest = Math.max(1, ...published.map(item => item.caseCount));
  return verificationCandidates.parse({ items, concurrency: Math.max(1, Math.min(3, Math.floor(capacity / largest))) });
}
