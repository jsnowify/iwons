import lessons from "@/data/foundation-lessons.json";
import modules from "@/data/foundation/modules.json";
import outline from "@/data/foundation/curriculum.json";
import type { FoundationStepProgress } from "./topic-foundations";
import type { RunResult } from "./types";

export type FoundationLanguage = "javascript" | "python";
export const foundationLanguages: { id: FoundationLanguage; label: string }[] = [
  { id: "javascript", label: "JavaScript" }, { id: "python", label: "Python" },
];
interface LessonBase { id: string; title: string; summary: string; topics: string[]; explanation: string[] }
/** One run of the learner's program: what is typed in (may be empty) and what it must print. */
export interface FoundationCase { stdin: string; expected: string }
export interface CodeLessonCopy extends LessonBase {
  type: "code"; exampleOutput: string; exampleInput?: string; task: string; expectedOutput: string; successMessage: string;
  // Several cases stop a program from just printing the answer; one case is the default.
  cases?: FoundationCase[];
  // Outputs may differ by language, for example true in JavaScript and True in Python.
  languages: Record<FoundationLanguage, { note: string; exampleCode: string; exampleOutput?: string; expectedOutput?: string }>;
}
export const lessonCases = (lesson: Pick<CodeLessonCopy, "cases" | "expectedOutput" | "languages">, language: FoundationLanguage): FoundationCase[] =>
  lesson.cases ?? [{ stdin: "", expected: lesson.languages[language].expectedOutput ?? lesson.expectedOutput }];
export const exampleOutputFor = (lesson: Pick<CodeLessonCopy, "exampleOutput" | "languages">, language: FoundationLanguage) =>
  lesson.languages[language].exampleOutput ?? lesson.exampleOutput;
export interface ConceptLessonCopy extends LessonBase {
  type: "concept"; illustration: string; illustrationCaption: string; successMessage: string;
  snippets?: Partial<Record<FoundationLanguage, { code: string; output: string; caption?: string }>>;
}
export type FoundationLessonCopy = CodeLessonCopy | ConceptLessonCopy;
export interface CodePractice {
  version: 2; id: string; type: "code";
  languages: Record<FoundationLanguage, { starterCode: string; hints: [string, string, string]; answerCode: string }>;
}
export interface ConceptQuestion { prompt: string; options: string[]; answer: number; explanation: string; hint: string }
export interface ConceptPractice { version: 2; id: string; type: "concept"; check: ConceptQuestion[] }
export type FoundationPractice = CodePractice | ConceptPractice;

// Additive content edition inside the existing v6 progress map. Legacy topic
// records remain untouched and continue to export, import, and sync as before.
export const FOUNDATION_TRACK_ID = "foundation-track-v1";
export const foundationLessons = lessons as unknown as FoundationLessonCopy[];
export const foundationLessonIds = lessons.map(lesson => lesson.id);
export interface FoundationModule { id: string; title: string; order: number }
export interface FoundationOutlineEntry {
  id: string; moduleId: string; type: "code" | "concept"; title: string; summary: string;
  // Present once the lesson has written content; progress is stored under this id.
  contentId?: string;
}
export const foundationModules: FoundationModule[] = modules;
export const foundationOutline = outline as FoundationOutlineEntry[];
export const foundationTotal = foundationOutline.length;
export function outlinePosition(contentId: string) {
  const index = foundationOutline.findIndex(entry => entry.contentId === contentId);
  return index < 0 ? null : { number: index + 1, entry: foundationOutline[index],
    module: foundationModules.find(item => item.id === foundationOutline[index].moduleId)! };
}
/** Neighbouring lessons that have content, in curriculum order. Never a prerequisite. */
export function neighbourLessons(contentId: string) {
  const ready = foundationOutline.filter(entry => entry.contentId);
  const index = ready.findIndex(entry => entry.contentId === contentId);
  return { previous: ready[index - 1]?.contentId, next: ready[index + 1]?.contentId };
}
// The first six lessons shipped under shorter ids before the 60-topic curriculum. Completion
// carries over from those records; drafts do not, because the tasks changed.
export const legacyLessonIds: Record<string, string> = {
  "input-output": "print-a-message", "variables-constants": "variables", operators: "simple-sum",
  "conditional-statements": "conditionals", "loops-iteration": "loops", "functions-procedures": "functions",
};
type Steps = Record<string, FoundationStepProgress> | undefined;
export const lessonDone = (steps: Steps, id: string) =>
  !!(steps?.[id]?.completed || (legacyLessonIds[id] && steps?.[legacyLessonIds[id]]?.completed));
export function moduleProgress(moduleId: string, steps?: Record<string, FoundationStepProgress>) {
  const entries = foundationOutline.filter(entry => entry.moduleId === moduleId);
  const done = entries.filter(entry => entry.contentId && lessonDone(steps, entry.contentId)).length;
  return { total: entries.length, done, ready: entries.filter(entry => entry.contentId).length, complete: done === entries.length };
}
export function lessonStatus(progress?: FoundationStepProgress, done = progress?.completed) {
  return done ? "Done" : progress ? "In progress" : "Not started";
}
export const lessonSentences = (lesson: Pick<LessonBase, "explanation">) =>
  lesson.explanation.join(" ").split(/(?<=[.!?])\s+/).filter(Boolean).length;
// Match at the start of a word, so "Logic" does not match inside "Topological".
const startsWord = (text: string, term: string) => text.split(/[^a-z0-9]+/).some(word => word.startsWith(term));
export function relatedFoundationLessons(topics: string[]) {
  const text = topics.join(" ").toLowerCase();
  // Plain suggestions only: a few relevant lessons, never a wall of links.
  return foundationLessons.filter(lesson => lesson.topics.some(topic => startsWord(text, topic.toLowerCase()))).slice(0, 4);
}
/** Draft and hint record for a language. JavaScript keeps the original lesson key so earlier work still loads. */
export const stepKey = (id: string, language: FoundationLanguage) => language === "javascript" ? id : `${id}-${language}`;
export function readFoundationPractice(value: unknown, id: string): FoundationPractice {
  const data = value as Partial<FoundationPractice> | null;
  if (!data || data.version !== 2 || data.id !== id) throw new Error("Invalid lesson practice.");
  if (data.type === "concept") {
    const check = (data as ConceptPractice).check;
    if (!Array.isArray(check) || check.length < 2 || check.length > 3 || !check.every(question =>
      typeof question.prompt === "string" && Array.isArray(question.options) && question.options.length >= 2 &&
      Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length &&
      typeof question.explanation === "string" && typeof question.hint === "string")) throw new Error("Invalid lesson practice.");
    return data as ConceptPractice;
  }
  const languages = (data as CodePractice).languages;
  if (data.type !== "code" || !languages || !foundationLanguages.every(({ id: key }) => {
    const item = languages[key];
    return item && typeof item.starterCode === "string" && typeof item.answerCode === "string" && Array.isArray(item.hints) &&
      item.hints.length === 3 && item.hints.every(hint => typeof hint === "string");
  })) throw new Error("Invalid lesson practice.");
  return data as CodePractice;
}
const printHint = { javascript: "console.log(...)", python: "print(...)" } as const;
export function lessonFeedback(result: RunResult, lesson: Pick<CodeLessonCopy, "successMessage">, language: FoundationLanguage = "javascript", cases: FoundationCase[] = []) {
  if (result.verdict === "accepted") return lesson.successMessage;
  if (result.verdict === "time_limit") return "Your code kept running, so the worker stopped it. Check where your loop stops, then try again.";
  const error = result.compileError?.message ?? result.cases.find(item => item.error)?.error;
  if (error) return `Check your spelling, quotes, brackets${language === "python" ? " and indentation" : ""}: ${error.slice(0, 280)}`;
  const index = Math.max(0, result.cases.findIndex(item => !item.passed));
  const failed = result.cases[index];
  // The raw printed text, because `actual` is JSON-shaped and turns NaN into null.
  const output = String(failed?.stdout || failed?.actual || "").trimEnd();
  const input = cases[index]?.stdin.trim();
  const prefix = input ? `For the input ${JSON.stringify(input.slice(0, 80))}, ` : "";
  if (!output) return `${prefix ? `${prefix}nothing` : "Nothing"} printed yet. Use ${printHint[language]} to show a value in the output, then run again.`;
  return `${prefix || ""}${prefix ? "your" : "Your"} code printed ${JSON.stringify(output.slice(0, 200))}. This task asks for ${JSON.stringify(String(failed?.expected ?? "").trimEnd())}. Check the value you print and try again.`;
}
