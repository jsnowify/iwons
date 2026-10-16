import type { Submission } from "./types";
export function retainSubmissions(
  submissions: Submission[],
  limit = 20,
): Submission[] {
  const groups = new Map<string, Submission[]>();
  for (const s of submissions) {
    const group = groups.get(s.problemId) ?? [];
    group.push(s);
    groups.set(s.problemId, group);
  }
  const keep = new Set<string>();
  for (const group of groups.values()) {
    const recent = group.slice(0, limit),
      accepted = group.find((s) => s.verdict === "accepted");
    if (accepted && !recent.includes(accepted)) {
      if (recent.length >= limit) recent.pop();
      recent.push(accepted);
    }
    for (const s of recent) keep.add(s.id);
  }
  return submissions.filter((s) => keep.has(s.id));
}
