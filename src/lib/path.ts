import levelProblems from "@/data/level-problems.json";
export function isLevelUnlocked(
  level: number,
  progress: Record<string, boolean>,
  freeBrowse = false,
) {
  if (freeBrowse || level === 0) return true;
  for (let i = 0; i < level; i++) {
    const previous = levelProblems[i] ?? [];
    if (
      !previous.length ||
      previous.filter((id) => progress[id]).length <
        Math.ceil(previous.length * 0.7)
    )
      return false;
  }
  return true;
}
export function levelProgress(
  level: number,
  progress: Record<string, boolean>,
) {
  const list = levelProblems[level] ?? [];
  return {
    solved: list.filter((id) => progress[id]).length,
    total: list.length,
    threshold: Math.ceil(list.length * 0.7),
  };
}
