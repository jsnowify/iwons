import { tracks } from "./model-v2";
export function validateLearnProgress(value:unknown):void {
  const record = (input:unknown):input is Record<string,unknown> => !!input && typeof input === "object" && !Array.isArray(input);
  if (!record(value) || Object.keys(value).length !== 4 || tracks.some(track=>!record(value[track]))) throw new Error("Invalid per-track Foundations progress.");
  for (const track of tracks) {
    const progress = value[track] as Record<string,unknown>;
    if (Object.keys(progress).sort().join() !== "checkpointScores,exercisesSolved,lessonsRead") throw new Error("Invalid Foundations progress fields.");
    for (const key of ["lessonsRead","exercisesSolved"]) if (!record(progress[key]) || Object.values(progress[key]).some(entry=>typeof entry !== "boolean")) throw new Error("Invalid Foundations completion map.");
    if (!record(progress.checkpointScores)) throw new Error("Invalid Foundations checkpoints.");
    for (const score of Object.values(progress.checkpointScores)) if (!record(score) || !Number.isInteger(score.total) || Number(score.total)<5 || Number(score.total)>8 || !Number.isInteger(score.correct) || Number(score.correct)<0 || Number(score.correct)>Number(score.total) || typeof score.at !== "number" || !Number.isFinite(score.at) || score.at<0) throw new Error("Invalid Foundations checkpoint score.");
  }
}
