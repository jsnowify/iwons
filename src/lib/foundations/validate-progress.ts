import type { FoundationsProgress } from "./types";
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function validateFoundationsProgress(value: unknown): asserts value is FoundationsProgress {
  if (!record(value) || Object.keys(value).some(key => !["lessonsRead", "exercisesSolved", "checkpointScores"].includes(key))) throw new Error("Invalid Foundations progress.");
  for (const key of ["lessonsRead", "exercisesSolved"] as const) {
    const map = value[key];
    if (!record(map) || Object.entries(map).some(([id, flag]) => !id || typeof flag !== "boolean")) throw new Error(`Invalid Foundations ${key}.`);
  }
  if (!record(value.checkpointScores) || Object.entries(value.checkpointScores).some(([id, score]) =>
    !id || !record(score) || score.total !== 5 || !Number.isInteger(score.correct) || Number(score.correct) < 0 || Number(score.correct) > 5 || typeof score.at !== "number" || !Number.isFinite(score.at) || score.at < 0,
  )) throw new Error("Invalid Foundations checkpoint scores.");
}
