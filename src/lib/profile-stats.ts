import type { Difficulty, Submission, Verdict } from "./types";

export const difficulties: Difficulty[] = ["easy", "medium", "hard"];
export const countedVerdicts: Exclude<Verdict, "internal_error">[] = ["accepted", "wrong_answer", "time_limit", "runtime_error", "compile_error"];
type Counted = (typeof countedVerdicts)[number];

/**
 * LeetCode-style profile numbers. Acceptance rate is accepted submissions over all
 * judged submissions; internal errors are our fault, so they are not counted.
 */
export function profileStats(
  submissions: Submission[],
  progress: Record<string, boolean>,
  catalog: { id: string; difficulty: Difficulty }[],
) {
  const level = new Map(catalog.map((p) => [p.id, p.difficulty] as const));
  const totals: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const p of catalog) totals[p.difficulty]++;
  const counted = submissions.filter((s) => s.verdict !== "internal_error");
  const verdicts = Object.fromEntries(countedVerdicts.map((v) => [v, 0])) as Record<Counted, number>;
  for (const s of counted) verdicts[s.verdict as Counted]++;
  const solvedIds = new Set([
    ...counted.filter((s) => s.verdict === "accepted").map((s) => s.problemId),
    ...Object.keys(progress).filter((id) => progress[id]),
  ]);
  const solved: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const id of solvedIds) {
    const d = level.get(id);
    if (d) solved[d]++;
  }
  // Solved on the very first attempt, judged by each problem's earliest submission.
  const first = new Map<string, Submission>();
  for (const s of counted) {
    const seen = first.get(s.problemId);
    if (!seen || s.at < seen.at) first.set(s.problemId, s);
  }
  const attempted = first.size;
  const firstTry = [...first.values()].filter((s) => s.verdict === "accepted").length;
  const attempts = counted.length;
  return {
    totals,
    solved,
    solvedTotal: solved.easy + solved.medium + solved.hard,
    problemTotal: catalog.length,
    attempts,
    accepted: verdicts.accepted,
    verdicts,
    acceptance: attempts ? Math.round((verdicts.accepted / attempts) * 1000) / 10 : 0,
    attempted,
    firstTry,
    firstTryRate: attempted ? Math.round((firstTry / attempted) * 100) : 0,
  };
}
