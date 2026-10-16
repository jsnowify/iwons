import { it, expect } from "vitest";
import { retainSubmissions } from "@/lib/retain-submissions";
import { integrityKind } from "@/lib/watch/badge";
import { summarize } from "@/lib/watch/score";
import type { Submission } from "@/lib/types";
it("retains accepted solve evidence after twenty subsequent failures", () => {
  const submissions = Array.from(
    { length: 26 },
    (_, i) =>
      ({
        id: String(i),
        problemId: "001",
        verdict: i === 25 ? "accepted" : "wrong_answer",
      }) as Submission,
  );
  const retained = retainSubmissions(submissions);
  expect(retained).toHaveLength(20);
  expect(retained[0].id).toBe("0");
  expect(retained.some((s) => s.verdict === "accepted")).toBe(true);
});
it("flags three contest exits even when capped score is eighty", () => {
  const summary = summarize(
    Array.from({ length: 3 }, () => ({
      t: 0,
      type: "fullscreen_exit" as const,
    })),
    true,
  );
  expect(summary.score).toBe(80);
  expect(integrityKind(summary, true)).toBe("flagged");
});
it("does not call a short tab switch a clean session", () => {
  const summary = summarize([
    { t: 0, type: "tab_hidden" },
    { t: 2000, type: "tab_visible", durationMs: 2000 },
  ]);
  expect(summary.score).toBe(100);
  expect(integrityKind(summary)).toBe("minor");
});
