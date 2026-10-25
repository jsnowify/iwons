import { describe, expect, it } from "vitest";
import { profileStats } from "@/lib/profile-stats";
import type { Submission } from "@/lib/types";

const sub = (problemId: string, verdict: Submission["verdict"], at: number) => ({ problemId, verdict, at }) as Submission;
const catalog = [
  { id: "a", difficulty: "easy" as const }, { id: "b", difficulty: "easy" as const },
  { id: "c", difficulty: "medium" as const }, { id: "d", difficulty: "hard" as const },
];
describe("profileStats", () => {
  it("is empty and finite with no submissions", () => {
    const s = profileStats([], {}, catalog);
    expect(s).toMatchObject({ attempts: 0, acceptance: 0, firstTryRate: 0, solvedTotal: 0, problemTotal: 4, totals: { easy: 2, medium: 1, hard: 1 } });
  });
  it("computes acceptance, difficulty split and first-try rate", () => {
    const s = profileStats([
      sub("a", "wrong_answer", 1), sub("a", "accepted", 2), sub("b", "accepted", 3),
      sub("c", "time_limit", 4), sub("c", "runtime_error", 5), sub("d", "internal_error", 6),
    ], {}, catalog);
    expect(s.attempts).toBe(5);
    expect(s.accepted).toBe(2);
    expect(s.acceptance).toBe(40);
    expect(s.solved).toEqual({ easy: 2, medium: 0, hard: 0 });
    expect(s.attempted).toBe(3);
    expect(s.firstTry).toBe(1);
    expect(s.firstTryRate).toBe(33);
    expect(s.verdicts).toMatchObject({ wrong_answer: 1, time_limit: 1, runtime_error: 1, compile_error: 0 });
  });
  it("counts imported solves and ignores ids outside the catalog", () => {
    const s = profileStats([], { c: true, "custom-1": true }, catalog);
    expect(s.solved).toEqual({ easy: 0, medium: 1, hard: 0 });
  });
});
