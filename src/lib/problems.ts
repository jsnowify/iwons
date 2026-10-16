import catalog from "@/data/catalog.json";
import levelData from "@/data/levels.json";
import legacy from "@/data/legacy-problems.json";
import { readFileSync } from "node:fs";
import type { Problem, ProblemSummary, PathLevel } from "./types";
export const getProblems = () => catalog as ProblemSummary[];
export const getProblem = (slug: string): Problem | undefined => {
  const entry = getProblems().find(p => p.slug === slug);
  if (!entry) return undefined;
  const {privateData, referenceSolutions, workedExamples, ...publicProblem} = JSON.parse(readFileSync(`src/data/problems/level-${entry.level}/${entry.unit}/${slug}.json`, "utf8"));
  return publicProblem as Problem;
};
export const getLevels = () => levelData as PathLevel[];
export const getLevel = (id: number) => getLevels().find((l) => l.id === id);
export const getLegacyProblems = () => legacy;
