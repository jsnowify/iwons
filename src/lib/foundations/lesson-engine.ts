import type { Track, LearnCourseId } from "./model-v2";
import type { Translated } from "./types";
import type { Rung } from "./learning-state";

export const interactionTypes = ["guess", "run", "trace", "fill", "parsons", "fix", "label", "change", "visualizer-predict", "quiz"] as const;
export type InteractionType = typeof interactionTypes[number];
export interface RecallCard {
  id: string; concept: string; format: "multiple-choice" | "short-answer" | "fill-in";
  copy: Translated<{ prompt: string; options?: string[] }>;
}
export interface LessonTrack {
  code: string; stdin: string;
  annotations?:Translated<{items:{line:number;text:string}[]}>;
  notes?:Translated<{items:string[]}>;
  predict: Translated<{ prompt: string }>;
  trace: Translated<{ steps: { line: number; state: string; message: string }[]; question: string }>;
  commonMistakes: Translated<{ items: string[] }>;
  modify: Translated<{ prompt: string }>;
  breakIt: Translated<{ prompt: string }>;
  recallCards: RecallCard[];
  ladder: { exerciseId: string; rung: Rung; concept: string; title?:string; slug?:string }[];
  skippedRungs: { concept: string; rung: Rung; reason: string }[];
}
export interface EngineLesson {
  id: string; moduleId: string; course: LearnCourseId; slug: string;
  concepts: string[]; introducedIn: Partial<Record<Track, Record<string, string>>>;
  interactionTypes: InteractionType[];
  opening: "predict" | "run"; estimatedMinutes: number;
  shared: Translated<{ title: string; story: string; idea: string; recap: string; make: string }>;
  tracks: Partial<Record<Track, LessonTrack>>;
}
export interface EngineModule {
  id:string;course:LearnCourseId;slug:string;
  copy:Translated<{title:string;intro:string;recallPrompt:string}>;
  lessonFiles:string[];exerciseFiles:string[];checkpointFile:string;
}
export interface RecallAnswer { answer: string; accepted?: string[]; caseSensitive?: boolean; reason: string; nextStep: string }
export interface LessonKeys {
  lessonId: string;
  tracks: Partial<Record<Track, {
    expectedOutput: string; predict: RecallAnswer; trace: RecallAnswer;
    modify: { cases: { id: string; stdin: string; expected: string }[]; referenceSolution: string };
    recall: Record<string, RecallAnswer>;
  }>>;
}
export function matchesRecall(answer: string, key: RecallAnswer) {
  const normalized = (value: string) => { const text=value.trim().replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, ""); return key.caseSensitive===false?text.toLowerCase():text; };
  // Preserve case: programming output and identifiers are case-sensitive.
  return [key.answer, ...(key.accepted ?? [])].some(value => normalized(answer) === normalized(value));
}
export function assembleParsons(blocks: { id: string; code: string; indent: number }[], order: string[], track: Track): string {
  if (new Set(order).size !== order.length || order.some(id => !blocks.some(block => block.id === id))) throw new Error("A block is missing or duplicated. Reset the blocks and try again.");
  return order.map(id => {
    const block = blocks.find(block => block.id === id)!;
    return block.code.split("\n").map(line => `${track === "python" ? "    ".repeat(block.indent) : ""}${line}`).join("\n");
  }).join("\n");
}
export function validateEngineLesson(lesson: EngineLesson, keys: LessonKeys): string[] {
  const errors: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) errors.push(`${lesson.id}: ${message}`); };
  check(keys.lessonId === lesson.id, "Private keys do not match the lesson.");
  check(new Set(lesson.interactionTypes).size >= 3 && lesson.interactionTypes.every(type => interactionTypes.includes(type)), "At least three distinct supported interactions are required.");
  check(["predict", "run"].includes(lesson.opening), "Open with Predict or Run.");
  check(lesson.estimatedMinutes >= 5 && lesson.estimatedMinutes <= 10, "Split lessons outside the 5–10 minute target.");
  const english = lesson.shared.translations.en;
  const words = (text: string) => text.trim().split(/\s+/).length;
  check(Object.values(english).filter(text => typeof text === "string").reduce((sum, text) => sum + words(text), 0) >= 250, "At least 250 words of shared explanation are required.");
  for (const [label, text] of Object.entries(english)) {
    check(!!text.trim(), `${label} is empty.`);
    check(words(text) <= 150, `${label} exceeds 150 continuous words.`);
    check(!/lorem ipsum|\bTODO\b|\bTBD\b|coming soon/i.test(text), `${label} contains placeholder text.`);
  }
  for (const [trackName, part] of Object.entries(lesson.tracks)) {
    const track = trackName as Track;
    const privatePart = keys.tracks[track];
    check(!!privatePart, `${track}: missing lazy answer pack.`);
    check(!!part.code.trim() && !!part.predict.translations.en.prompt.trim() && !!part.modify.translations.en.prompt.trim(), `${track}: Predict, Run and Modify are required.`);
    check((part.annotations?.translations.en.items.length??0)>0&&!!part.notes,`${track}: annotated code and language notes are required.`);
    check(part.trace.translations.en.steps.length >= 2 && !!part.trace.translations.en.question, `${track}: Investigate needs a trace and question.`);
    check(part.commonMistakes.translations.en.items.length > 0 && !!part.breakIt.translations.en.prompt.trim(), `${track}: common mistakes and Try to break it are required.`);
    check(part.recallCards.length >= 3 && part.recallCards.length <= 6 && new Set(part.recallCards.map(card => card.format)).size > 1, `${track}: use 3–6 recall cards in more than one format.`);
    check(part.ladder.length > 0 && !!english.make.trim() && !!english.recap.trim(), `${track}: Make and recap are required.`);
    const formats = new Set(part.recallCards.map(card => card.id));
    check(formats.size === part.recallCards.length, `${track}: duplicate recall card id.`);
    for (const card of part.recallCards) {
      const key = privatePart?.recall[card.id];
      check(!!key?.answer && !!key.reason && !!key.nextStep, `${track}/${card.id}: missing answer, reason or next step.`);
      check(lesson.concepts.includes(card.concept), `${track}/${card.id}: unknown concept.`);
      if (card.format === "multiple-choice") {
        check((card.copy.translations.en.options?.length ?? 0) >= 2, `${track}/${card.id}: missing choices.`);
        check(!!key && !!card.copy.translations.en.options?.includes(key.answer), `${track}/${card.id}: answer must match a choice.`);
      }
    }
    for (const concept of lesson.concepts) {
      for (const rung of ["worked", "completion", "parsons", "fix", "write"] as const) {
        check(part.ladder.some(item => item.concept === concept && item.rung === rung) || part.skippedRungs.some(item => item.concept === concept && item.rung === rung && item.reason.trim()), `${track}/${concept}: missing ${rung} rung or reason.`);
      }
    }
    if (privatePart) {
      for (const key of [privatePart.predict, privatePart.trace]) check(!!key.answer && !!key.reason && !!key.nextStep, `${track}: feedback needs a reason and next step.`);
      check(privatePart.modify.cases.length > 0 && !!privatePart.modify.referenceSolution.trim(), `${track}: Modify requires test cases and a reference.`);
    }
  }
  check(Object.keys(lesson.tracks).length > 0, "No track content.");
  return errors;
}
