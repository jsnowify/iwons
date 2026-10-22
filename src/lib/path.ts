import levelProblems from "@/data/level-problems.json";
// Kept for existing callers and backups. Progress never controls access.
export function isLevelUnlocked(_level: number, _progress: Record<string, boolean>, _freeBrowse = false) {
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
