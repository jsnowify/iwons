export const lessonLanguages = ["en", "fil", "ceb"] as const;
export type LessonLanguage = (typeof lessonLanguages)[number];
export type TranslationStatus = "draft" | "reviewed";
export interface Translated<T> {
  // Null explicitly marks a missing translation. English is always required.
  translations: Record<LessonLanguage, T | null> & { en: T };
  translationStatus: Record<LessonLanguage, TranslationStatus>;
}
export type CourseId = "cp1" | "cp2";
export type ExerciseKind = "predict" | "fix" | "fill" | "code" | "program" | "project";
export interface Course {
  id: CourseId;
  slug: CourseId;
  order: number;
  moduleIds: string[];
  prerequisites: CourseId[];
  languages: LessonLanguage[];
}
export interface Module {
  id: string;
  slug: string;
  courseId: CourseId;
  order: number;
  lessonIds: string[];
  exerciseIds: string[];
  checkpointId: string;
  capstone: boolean;
  languages: LessonLanguage[];
}
export interface Lesson {
  id: string;
  slug: string;
  moduleId: string;
  order: number;
  // Each concept names the lesson that first introduces it, always this ID.
  introducedIn: Record<string, string>;
  languages: LessonLanguage[];
}
export interface ExerciseEntry {
  id: string;
  slug: string;
  moduleId: string;
  afterLessonId: string;
  order: number;
  kind: ExerciseKind;
  concepts: string[];
  difficulty: "easy" | "medium" | "hard";
  task: string;
  ioMode: "function" | "program";
  javaMinVersion: 8;
  xp: number;
}
export interface FoundationsManifest {
  schemaVersion: 1;
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  exercises: ExerciseEntry[];
}
export interface ModuleCopy { title: string; manualLine: string; intro: string }
export type ModuleContent = Module & Translated<ModuleCopy>;
export interface LessonCopy {
  title: string;
  idea: string;
  annotations: { line: number; text: string }[];
  trace: { line: number; variables: Record<string, string>; explanation: string }[];
  commonMistakes: string[];
  newerJavaNotes: { version: number; explanation: string }[];
}
export type LessonContent = Lesson & Translated<LessonCopy> & {
  javaExample: string;
  newerJavaExamples: { version: 10 | 14 | 15 | 16; code: string }[];
};
export interface ExerciseCopy {
  title: string;
  statement: string;
  hints: [string, string, string];
  options: { id: string; text: string }[];
  steps: string[];
}
export interface JavaCase { id: string; input: unknown[]; stdin?: string; expected: unknown; boundary?: boolean }
export type ExerciseContent = ExerciseEntry & Translated<ExerciseCopy> & {
  track: "foundations";
  starterCode: string;
  functionName?: string;
  javaParams?: string[];
  comparison?: { floatTolerance?: number; unordered?: boolean };
  cases: JavaCase[];
};
// Only lazy private packs may contain these fields. Never pass them to SSR clients.
export interface ExercisePrivate {
  exerciseId: string;
  referenceSolution?: string;
  hiddenCases: JavaCase[];
  correctOptionId?: string;
  explanations: Record<LessonLanguage, string | null> & { en: string };
}
export interface CheckpointCopy {
  questions: { id: string; prompt: string; options: { id: string; text: string }[] }[];
}
export type Checkpoint = Translated<CheckpointCopy> & { id: string; moduleId: string };
export interface CheckpointPrivate {
  checkpointId: string;
  answers: { questionId: string; correctOptionId: string; explanations: Record<LessonLanguage, string | null> & { en: string } }[];
}
export interface FoundationsProgress {
  lessonsRead: Record<string, boolean>;
  exercisesSolved: Record<string, boolean>;
  checkpointScores: Record<string, { correct: number; total: 5; at: number }>;
}
export function emptyFoundationsProgress(): FoundationsProgress {
  return { lessonsRead: {}, exercisesSolved: {}, checkpointScores: {} };
}
