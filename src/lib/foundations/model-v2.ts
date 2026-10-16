import type { LessonLanguage, Translated } from "./types";
export const tracks = ["java", "javascript", "typescript", "python"] as const;
export type Track = typeof tracks[number];
export const trackNames: Record<Track, string> = { java: "Java", javascript: "JavaScript", typescript: "TypeScript", python: "Python" };
export const baselines: Record<Track, string> = { java: "Java 8. Beta: requires your configured Judge0 endpoint.", javascript: "Modern ES2015+ JavaScript. Node-style input in a dedicated worker.", typescript: "TypeScript 5.9.3, strict type checking; executed as JavaScript in a worker.", python: "Python 3.14.2 in pinned Pyodide v314.0.7, verified in the browser runtime check." };
export type LearnCourseId = "cp1" | "cp2" | "dsa";
export const courseSlugs: Record<LearnCourseId, string> = {
  cp1: "computer-programming-1",
  cp2: "computer-programming-2",
  dsa: "data-structures-and-algorithms",
};
export const courseNames: Record<LearnCourseId, string> = {
  cp1: "Computer Programming 1",
  cp2: "Computer Programming 2",
  dsa: "Data Structures and Algorithms",
};
export function courseIdFromSlug(slug: string | undefined): LearnCourseId | undefined {
  return (Object.keys(courseSlugs) as LearnCourseId[]).find(id => courseSlugs[id] === slug);
}
export type ContentStatus = "planned" | "draft" | "ready";
export type Availability = Record<Track, ContentStatus>;
export interface LearnLesson {
  id: string; slug: string; title: string; status: ContentStatus;
  availability: Availability; languages: LessonLanguage[];
  variants: Partial<Record<Track, { concepts: string[]; introducedIn: Record<string,string>; contentFile: string }>>;
}
export interface LearnModule {
  id: string; slug: string; title: string; status: ContentStatus; availability: Availability;
  lessons: LearnLesson[]; practiceUnits: string[]; beforeYouStart?: string;
  limitedTracks?:Track[];limitedReason?:string;
}
export interface LearnCourse {
  id: LearnCourseId; title: string; description: string; recommended: string;
  modules: LearnModule[];
}
export interface LearnManifest { schemaVersion: 2; courses: LearnCourse[] }
export interface TrackLessonPart {
  exampleCode: string; expectedOutput: string;
  copy: Translated<{ annotations: {line:number;text:string}[]; trace: {line:number;state:Record<string,string>;message:string}[]; commonMistakes:string[]; notes:string[] }>;
  concepts: string[]; introducedIn: Record<string,string>;
}
export interface MultiTrackLesson {
  id: string;
  shared: Translated<{title:string;story:string;idea:string;pattern?:{useWhen:string;watchOut:string};complexity?:string}>;
  tracks: Partial<Record<Track, TrackLessonPart>>;
}
export interface MultiTrackExercise {
  id:string; kind:"predict"|"fix"|"fill"|"code"|"program"|"project"|"build"|"parsons"|"trace";
  slug?:string; moduleId?:string; afterLessonId?:string;
  rung?:import("./learning-state").Rung; conceptId?:string; limitedReason?:string;
  track:"foundations"|"dsa"; tracks?:Track[]; ioMode:"function"|"operations"|"program";
  shared:Translated<{title:string;statement:string;hints:[string,string,string]}>;
  cases:{id:string;input:unknown[];stdin?:string;expected:unknown}[];
  variants:Partial<Record<Track,{
    starterCode:string;functionName:string;javaParams?:string[];concepts:string[];introducedIn:Record<string,string>;
    snippet?:string;copy?:Translated<{options:{id:string;text:string}[];hint?:string}>;
    parsons?:{blocks:{id:string;code:string;indent:number}[];initialOrder:string[];distractors?:string[]};
    workedSteps?:Translated<{steps:{label:string;code:string;prompt:string}[]}>;
  }>>;
  javaMinVersion?:8; xp:number;
}
// These packs are lazy assets, never props on a server-rendered content page.
export interface MultiTrackExercisePrivate {
  exerciseId:string;hiddenCases:MultiTrackExercise["cases"];
  variants:Partial<Record<Track,{referenceSolution:string;correctOptionId?:string;correctAnswer?:string;alternativeOrders?:string[][];explanations:Translated<{text:string}>}>>;
}
export interface TrackProgress {
  lessonsRead: Record<string,boolean>; exercisesSolved: Record<string,boolean>;
  checkpointScores: Record<string,{correct:number;total:number;at:number}>;
}
export type LearnProgress = Record<Track, TrackProgress>;
export function emptyLearnProgress(): LearnProgress {
  return Object.fromEntries(tracks.map(track => [track,{lessonsRead:{},exercisesSolved:{},checkpointScores:{}}])) as LearnProgress;
}
export function isTrack(value: unknown): value is Track { return tracks.includes(value as Track); }
