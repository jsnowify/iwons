import data from "@/data/catalog.json";
import type { ProblemSummary } from "./types";
export const problems = data as ProblemSummary[];
export const topics = [...new Set(problems.flatMap((p) => p.topics))];
export { topicSlug, languageNames, verdictNames, problemUrl } from "./presentation";
