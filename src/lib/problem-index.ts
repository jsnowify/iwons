import data from "@/data/problem-index.json";
export const problems = data;
export type ProblemIndexEntry = (typeof data)[number];
