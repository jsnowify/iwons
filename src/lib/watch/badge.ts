import type { IntegritySummary } from "@/lib/types";
export function integrityKind(
  summary: IntegritySummary,
  contest = false,
): "clean" | "minor" | "flagged" {
  if ((contest && summary.fullscreenExits >= 3) || summary.score < 80)
    return "flagged";
  return summary.score === 100 &&
    summary.tabSwitches === 0 &&
    summary.totalAwayMs === 0
    ? "clean"
    : "minor";
}
