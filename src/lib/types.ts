export type Language = "javascript" | "typescript" | "python" | "java";
export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit"
  | "compile_error";
export type Difficulty = "easy" | "medium" | "hard";
export interface TestCase {
  id: string;
  input: unknown[];
  expected: unknown;
  explanation?: string;
  stdin?: string;
}
export interface Problem {
  track?: "path" | "foundations" | "dsa";
  kind?: "predict"|"fix"|"fill"|"code"|"program"|"project"|"build"|"parsons"|"trace";
  ioMode?: "function" | "program";
  javaMinVersion?: number;
  concepts?: string[];
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  level: number;
  prerequisites: string[];
  topics: string[];
  patterns: string[];
  descriptionMd: string;
  constraints: string[];
  hints: string[];
  functionName: string;
  mode: "function" | "operations";
  starterCode: Record<Language, string>;
  cases: TestCase[];
  timeLimitMs: number;
  comparison?: { unordered?: boolean; floatTolerance?: number };
  inputKinds?: Record<string, "list" | "tree" | "cycle">;
  outputKind?: "list" | "tree";
  complexity: { time: string; space: string };
  overview: string;
  javaParams: string[];
  privateData?: PrivateProblem;
  unit?: string;
  stage?: string;
  boss?: boolean;
  revisit?: string;
}
export type ProblemSummary = Pick<Problem, "id" | "slug" | "title" | "difficulty" | "level" | "prerequisites" | "topics" | "patterns" | "overview" | "complexity" | "unit" | "stage" | "boss" | "revisit"> & { summary?: string; order?: number };
export interface PrivateProblem {
  hiddenCases: TestCase[];
  editorialMd: string;
}
export interface CaseResult {
  id: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  stdout: string;
  runtimeMs: number;
  error?: string;
}
export interface RunRequest {
  strictTypes?: boolean;
  action?: "run" | "submit";
  code: string;
  functionName: string;
  cases: TestCase[];
  timeLimitMs: number;
  comparison?: Problem["comparison"];
  mode: Problem["mode"] | "program";
  stdin?: string;
  inputKinds?: Problem["inputKinds"];
  outputKind?: Problem["outputKind"];
  javaParams?: string[];
}
export interface RunResult {
  diagnostics?: {message:string;line?:number}[];
  runtimeVersion?: string;
  verdict: Verdict;
  cases: CaseResult[];
  compileError?: { message: string; line?: number };
}
export interface Runner {
  language: Language;
  run(req: RunRequest): Promise<RunResult>;
}
export type EventType =
  | "tab_hidden"
  | "tab_visible"
  | "window_blur"
  | "window_focus"
  | "paste"
  | "typing_burst"
  | "fullscreen_exit"
  | "multi_tab"
  | "copy_problem"
  | "devtools_hint";
export interface IntegrityEvent {
  t: number;
  type: EventType;
  durationMs?: number;
  selfReport?: "docs" | "other_browser" | "phone" | "break" | "other";
  meta?: Record<string, unknown>;
}
export interface IntegritySummary {
  score: number;
  tabSwitches: number;
  totalAwayMs: number;
  pastes: number;
  largestPasteChars: number;
  fullscreenExits: number;
  browser: string;
  events: IntegrityEvent[];
}
export interface Submission {
  id: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  passed: number;
  total: number;
  runtimeMs: number;
  at: number;
  timeSpentMs: number;
  mode: "practice" | "contest";
  hintsUsed: number;
  viewedEditorial: boolean;
  integrity: IntegritySummary;
  results: CaseResult[];
}
export interface Review {
  problemId: string;
  step: number;
  due: number;
  lastRating?: string;
}
export interface StudyList {
  id: string;
  name: string;
  problemIds: string[];
}
export interface Settings {
  codeTrack?: Language;
  lessonLanguage?: string;
  theme: "dark" | "light";
  language: Language;
  fontSize: number;
  tabSize: number;
  javaBackend: "remote" | "cheerpj";
  judgeUrl: string;
  taglish?: boolean;
  countdownMinutes: number;
  autoSubmit: boolean;
  readableText: boolean;
  motion: boolean;
  sound: boolean;
  freeBrowse: boolean;
}
export interface PathLevel { id:number; name:string; subtitle:string; tier:Difficulty; count:number; released:boolean; primer:string; example:string; concepts:string[] }
export interface LegacyArchive { schemaVersion:1|2; migratedAt:number; sourcePrefix?:string; data?:Record<string,unknown> }
export interface Profile {
  name: string;
  avatar: string;
  onboarded: boolean;
}
export interface ContestSession {
  id: string;
  problemIds: string[];
  startedAt: number;
  endsAt: number;
  mode: "contest" | "mock";
  finished: boolean;
}
