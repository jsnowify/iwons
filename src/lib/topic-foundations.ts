import type { RunResult, TestCase, Problem } from "./types";

export interface FoundationStep {
  id: string; title: string; explanation: string; exampleCode: string;
  starterCode: string; task: string; functionName: string;
  referenceCode?: string;
  validate: TestCase[]; hints: [string, string, string]; successMessage: string;
  mistakeMessages: { pattern: string; message: string }[];
  inputKinds?: Problem["inputKinds"];
  recall?: { prompt: string; answer: string };
}
export interface FoundationTopic {
  id: string; title: string; concepts: string[];
  foundation: { steps: FoundationStep[] };
  challenges: string[];
}
export interface FoundationStepProgress {
  code: string; completed: boolean; hintsUsed: number; attempts: number;
}
export type TopicFoundationProgress = Record<string, {
  steps: Record<string, FoundationStepProgress>; completed: boolean;
}>;

export function foundationComplete(steps: FoundationStep[], progress: Record<string, FoundationStepProgress>) {
  return steps.length > 0 && steps.every(step => progress[step.id]?.completed);
}
export function foundationFeedback(result: RunResult, step: FoundationStep) {
  if (result.verdict === "accepted") return step.successMessage;
  const error = result.compileError?.message ?? result.cases.find(c => c.error)?.error ?? "";
  for (const mistake of step.mistakeMessages)
    if (error.toLowerCase().includes(mistake.pattern.toLowerCase())) return mistake.message;
  if (result.verdict === "time_limit") return "Your code kept running. Check where your loop stops, then try again.";
  if (error) return `Let's check this together: ${error}`;
  const failed = result.cases.find(c => !c.passed);
  return failed
    ? `Almost! For ${JSON.stringify(step.validate.find(c => c.id === failed.id)?.input)}, your code returned ${JSON.stringify(failed.actual)}. We need ${JSON.stringify(failed.expected)}. Trace the example once more.`
    : "The runner could not finish. Please try again.";
}
export function validateTopicFoundations(value: unknown): asserts value is TopicFoundationProgress {
  const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (!record(value)) throw new Error("Invalid topic foundation progress.");
  for (const topic of Object.values(value)) {
    if (!record(topic) || typeof topic.completed !== "boolean" || !record(topic.steps)) throw new Error("Invalid topic foundation progress.");
    for (const step of Object.values(topic.steps)) {
      if (!record(step) || typeof step.code !== "string" || typeof step.completed !== "boolean" || !Number.isInteger(step.hintsUsed) || Number(step.hintsUsed) < 0 || Number(step.hintsUsed) > 3 || !Number.isSafeInteger(step.attempts) || Number(step.attempts) < 0) throw new Error("Invalid foundation step progress.");
    }
  }
}
