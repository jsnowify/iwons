import { readFileSync } from "node:fs";
import type { ProblemSummary } from "./types";
export const problems = JSON.parse(readFileSync("src/data/catalog.json", "utf8")) as ProblemSummary[];
export const topics = [...new Set(problems.flatMap(p => p.topics))];
export { topicSlug, languageNames, verdictNames, problemUrl } from "./presentation";
