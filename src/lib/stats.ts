import type { Submission } from "./types";
import { integrityKind } from "./watch/badge";
export const localDay = (date: number | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function getStats(submissions: Submission[]) {
  const accepted = submissions.filter((s) => s.verdict === "accepted");
  const solved = new Set(accepted.map((s) => s.problemId));
  const clean = accepted.filter(
    (s) =>
      integrityKind(s.integrity, s.mode === "contest") === "clean" &&
      !s.viewedEditorial &&
      s.hintsUsed === 0,
  );
  const cleanIds = new Set(clean.map((s) => s.problemId));
  const days = new Set(accepted.map((s) => localDay(s.at)));
  let streak = 0;
  const day = new Date();
  if (!days.has(localDay(day))) day.setDate(day.getDate() - 1);
  while (days.has(localDay(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  const xp = solved.size * 100 + cleanIds.size * 25;
  let cleanStreak = 0;
  for (const s of accepted) {
    if (
      integrityKind(s.integrity, s.mode === "contest") !== "clean" ||
      s.viewedEditorial ||
      s.hintsUsed > 0
    )
      break;
    cleanStreak++;
  }
  return {
    accepted,
    solved,
    clean: cleanIds.size,
    cleanRate: solved.size
      ? Math.round((cleanIds.size / solved.size) * 100)
      : 0,
    streak,
    cleanStreak,
    xp,
    level: Math.floor(xp / 500) + 1,
  };
}
