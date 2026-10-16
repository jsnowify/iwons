// Compatibility-only schemas for archived v4-v6 personal data. No active course UI.
import type { Language } from "./types";
import { intervals, type Rating } from "./srs";
type Track=Language;
type LearnCourseId="cp1"|"cp2"|"dsa";
export const tracks=["java","javascript","typescript","python"] as const;
export function isTrack(value:unknown):value is Language{return tracks.includes(value as Language);}
export function isStoredLanguagePreference(value:unknown):value is string{return typeof value==="string";}
export interface FoundationsProgress {lessonsRead:Record<string,boolean>;exercisesSolved:Record<string,boolean>;checkpointScores:Record<string,{correct:number;total:5;at:number}>;}
export function emptyFoundationsProgress():FoundationsProgress{return {lessonsRead:{},exercisesSolved:{},checkpointScores:{}};}
interface TrackProgress {lessonsRead:Record<string,boolean>;exercisesSolved:Record<string,boolean>;checkpointScores:Record<string,{correct:number;total:number;at:number}>;}
export type LearnProgress=Record<Language,TrackProgress>;
export function emptyLearnProgress():LearnProgress{return Object.fromEntries(tracks.map(track=>[track,{lessonsRead:{},exercisesSolved:{},checkpointScores:{}}])) as LearnProgress;}

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

export function isLearningDay(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(`${day}T12:00:00Z`))&&new Date(`${day}T12:00:00Z`).toISOString().slice(0,10)===day;}
export function learningWeekStart(day:string){const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString().slice(0,10);}
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
