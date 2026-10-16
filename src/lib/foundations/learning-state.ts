import { isLearningDay, learningWeekStart } from "./learning-rewards";
import { isTrack, type Track, type LearnCourseId } from "./model-v2";
import { intervals, type Rating } from "../srs";

export type LearningCourse = LearnCourseId | "path";
export type Rung = "worked" | "completion" | "parsons" | "fix" | "write";
export interface RecallState {
  cardId: string; course: LearningCourse; track: Track; concept: string;
  step: number; due: number; lastRating?: Rating; successes: number; misses: number;
}
export interface LearningAttempt {
  exerciseId: string; course: LearningCourse; track: Track; concept: string;
  rung: Rung; at: number; correct: boolean; clean: boolean; hints: number;
  confidence: 1 | 2 | 3; durationMs: number; day?:string;
}
export interface RecallEvent { key: string; at: number; correct: boolean; rating: Rating; day?:string }
export interface LearningSession {
  id: string; track: Track; startedAt: number; endedAt: number;
  recalled: string[]; revisit: string[]; completed: string[];
}
export interface ActiveLearningSession {
  id:string;track:Track;lessonId:string;exerciseId:string;startedAt:number;
  phase:"warmup"|"lesson"|"exercise";recalled:string[];revisit:string[];
}
export interface LearningState {
  recalls: Record<string, RecallState>; recallLog: RecallEvent[];
  attempts: LearningAttempt[]; explanations: Record<string, string>;
  sessions: LearningSession[]; completedModules: Record<string, number>;
  importedChallenges: Record<string, { track: Track; exerciseIds: string[] }>;
  streakFreezes: string[];
  activeSession?:ActiveLearningSession;
}
export function emptyLearningState(): LearningState {
  return { recalls: {}, recallLog: [], attempts: [], explanations: {}, sessions: [], completedModules: {}, importedChallenges: {}, streakFreezes: [] };
}
export function recallKey(course: LearningCourse, track: Track, concept: string, cardId: string) {
  return [course, track, concept, cardId].map(encodeURIComponent).join(":");
}
export function rateRecall(card: RecallState, rating: Rating, correct: boolean, now: number): RecallState {
  // A failed retrieval cannot be promoted by tapping Easy. Keep the existing
  // Path scheduler unchanged; recall cards add short same-session retry.
  const effective = correct ? rating : "Again";
  const step = effective === "Again" ? 0 : effective === "Hard" ? card.step : Math.min(intervals.length - 1, card.step + (effective === "Easy" ? 2 : 1));
  return { ...card, step, due: now + (effective === "Again" ? 10 * 60000 : intervals[step] * 86400000), lastRating: effective,
    successes: card.successes + (correct ? 1 : 0), misses: card.misses + (correct ? 0 : 1) };
}
export function conceptMastery(state: LearningState, course: LearningCourse, track: Track, concept: string): number {
  const solves = state.attempts.filter(item => item.course === course && item.track === track && item.concept === concept).slice(-5);
  const recalls = Object.entries(state.recalls).filter(([, item]) => item.course === course && item.track === track && item.concept === concept);
  const keys = new Set(recalls.map(([key]) => key));
  const retrieval = state.recallLog.filter(item => keys.has(item.key)).slice(-5);
  const outcomes = [...solves.map(item => item.correct && item.clean ? 1 : item.correct ? 0.5 : 0), ...retrieval.map(item => item.correct ? 1 : 0)];
  return outcomes.length ? Math.round(outcomes.reduce<number>((a, b) => a + b, 0) / outcomes.length * 100) : 0;
}
export function suggestedRung(state: LearningState, track: Track, concept: string): { rung: Rung; reason: string } | null {
  const recent = state.attempts.filter(item => item.track === track && item.concept === concept).slice(-2);
  if (recent.length < 2) return null;
  if (recent.every(item => item.rung === "write" && !item.correct)) return { rung: "parsons", reason: "Try arranging a working program, then return to writing your own." };
  if (recent.every(item => item.correct && item.clean)) return { rung: "write", reason: "Your last two solutions worked without hints. Try writing the next one independently." };
  return null;
}
export function calibration(state: LearningState, course: LearningCourse, track: Track) {
  return ([1, 2, 3] as const).map(confidence => {
    const items = state.attempts.filter(item => item.course === course && item.track === track && item.confidence === confidence);
    return { confidence, attempts: items.length, correct: items.filter(item => item.correct).length };
  });
}
export function dailyShuffle<T extends { id: string }>(items: T[], day: string, track: Track): T[] {
  const hash = (text: string) => { let value = 2166136261; for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619); return value >>> 0; };
  return [...items].sort((a, b) => hash(`${day}:${track}:${a.id}`) - hash(`${day}:${track}:${b.id}`) || a.id.localeCompare(b.id));
}

export function validateLearningState(value: unknown): asserts value is LearningState {
  const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
  const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const timestamp=(value:unknown)=>number(value)&&!Number.isNaN(new Date(value as number).getTime());
  const text = (value: unknown) => typeof value === "string" && value.length > 0;
  const course = (value: unknown) => typeof value === "string" && ["cp1", "cp2", "dsa", "path"].includes(value);
  const strings = (value: unknown) => Array.isArray(value) && value.every(text);
  const ratings = ["Again", "Hard", "Good", "Easy"];
  if (!object(value) || !object(value.recalls) || !object(value.explanations) || !object(value.completedModules) || !object(value.importedChallenges)
    || !Array.isArray(value.attempts) || !Array.isArray(value.recallLog) || !Array.isArray(value.sessions) || (!strings(value.streakFreezes)||!Array.isArray(value.streakFreezes)||value.streakFreezes.some(day=>typeof day!=="string"||!isLearningDay(day)))) throw new Error("Invalid learning data. Import an intact Iwons backup.");
  const freezes=value.streakFreezes as string[];const ordered=[...freezes].sort();
  if(new Set(freezes.map(learningWeekStart)).size!==freezes.length||ordered.some((day,index)=>index>0&&Date.parse(`${day}T12:00:00Z`)-Date.parse(`${ordered[index-1]}T12:00:00Z`)===86400000))throw new Error("Invalid weekly learning freezes. Import an intact Iwons backup.");
  for (const [key, item] of Object.entries(value.recalls)) {
    if (!object(item) || !text(item.cardId) || !course(item.course) || !isTrack(item.track) || !text(item.concept) || !Number.isInteger(item.step) || Number(item.step) < 0 || Number(item.step) >= intervals.length
      || !timestamp(item.due) || !number(item.successes) || !number(item.misses) || (item.lastRating !== undefined && (typeof item.lastRating !== "string" || !ratings.includes(item.lastRating)))
      || key !== recallKey(item.course as LearningCourse, item.track as Track, String(item.concept), String(item.cardId))) throw new Error("Invalid recall schedule. Import an intact Iwons backup.");
  }
  for (const item of value.attempts) if (!object(item) || !text(item.exerciseId) || !course(item.course) || !isTrack(item.track) || !text(item.concept)
    || (typeof item.rung !== "string" || !["worked", "completion", "parsons", "fix", "write"].includes(item.rung)) || !timestamp(item.at) || typeof item.correct !== "boolean" || typeof item.clean !== "boolean"
    || !number(item.hints) || (typeof item.confidence !== "number" || ![1, 2, 3].includes(item.confidence)) || !number(item.durationMs) || (item.day!==undefined&&(typeof item.day!=="string"||!isLearningDay(item.day)))) throw new Error("Invalid learning attempt. Import an intact Iwons backup.");
  for (const item of value.recallLog) if (!object(item) || !text(item.key) || !Object.hasOwn(value.recalls, String(item.key)) || !timestamp(item.at) || typeof item.correct !== "boolean" || (typeof item.rating !== "string" || !ratings.includes(item.rating)) || (item.day!==undefined&&(typeof item.day!=="string"||!isLearningDay(item.day)))) throw new Error("Invalid recall history. Import an intact Iwons backup.");
  for (const item of value.sessions) if (!object(item) || !text(item.id) || !isTrack(item.track) || !timestamp(item.startedAt) || !timestamp(item.endedAt) || Number(item.endedAt) < Number(item.startedAt)
    || !strings(item.recalled) || !strings(item.revisit) || !strings(item.completed)) throw new Error("Invalid learning session. Import an intact Iwons backup.");
  if(value.activeSession!==undefined){const item=value.activeSession;if(!object(item)||!text(item.id)||!isTrack(item.track)||!text(item.lessonId)||!text(item.exerciseId)||!timestamp(item.startedAt)||!["warmup","lesson","exercise"].includes(String(item.phase))||!strings(item.recalled)||!strings(item.revisit))throw new Error("Invalid current learning session. Import an intact Iwons backup.");}
  if (Object.values(value.explanations).some(item => typeof item !== "string") || Object.values(value.completedModules).some(item => !number(item))) throw new Error("Invalid learning notes. Import an intact Iwons backup.");
  for (const item of Object.values(value.importedChallenges)) if (!object(item) || !isTrack(item.track) || !strings(item.exerciseIds)) throw new Error("Invalid challenge. Import an intact Iwons backup.");
}
