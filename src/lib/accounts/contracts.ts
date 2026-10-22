import { z } from "zod";
import { languageKey } from "../judge0/contracts";

export const problemId = z.string().regex(/^[a-z0-9-]{1,100}$/);
export const handleFormat = z.string().min(3).max(20).regex(/^[a-z0-9_]+$/);
export const handleSchema = handleFormat.refine(value =>
  !["admin", "administrator", "support", "iwons", "moderator", "root", "fuck", "shit", "asshole"].some(word => value.includes(word)), "Choose a different handle.");
export const handleAvailabilityResponse = z.object({ available: z.boolean(), reason: z.enum(["invalid", "reserved", "taken"]).optional() }).strict();
export function invalidHandleReason(value: string): "invalid" | "reserved" | null {
  return !handleFormat.safeParse(value).success ? "invalid" : !handleSchema.safeParse(value).success ? "reserved" : null;
}
const timestamp = z.number().int().min(0).max(8_640_000_000_000_000).refine(value => value <= Date.now() + 300_000, "Timestamp is too far in the future.");
const boundedRecord = <T extends z.ZodType>(key: z.ZodString, value: T) => z.record(key, value).refine(items => Object.keys(items).length <= 5000, "Too many entries.");
export const foundationProgress = boundedRecord(problemId, z.object({ completed: z.boolean(),
  steps: boundedRecord(problemId, z.object({ code: z.string().max(20_000), completed: z.boolean(),
    hintsUsed: z.number().int().min(0).max(3), attempts: z.number().int().nonnegative().max(1_000_000), updatedAt: timestamp.optional() }).strict()),
}).strict());
const preferenceKey = z.enum(["theme", "language", "fontSize", "tabSize", "readableText", "motion", "sound", "freeBrowse", "countdownMinutes", "autoSubmit"]);
const preference = z.object({ value: z.union([z.string().max(32), z.boolean(), z.number().finite()]), updatedAt: timestamp }).strict();
const preferences = z.partialRecord(preferenceKey, preference).superRefine((entries, context) => {
  const schemas: Record<string, z.ZodType> = { theme: z.enum(["light", "dark"]), language: z.enum(["java", "python", "javascript", "typescript"]),
    fontSize: z.number().int().min(8).max(32), tabSize: z.number().int().min(1).max(8), countdownMinutes: z.number().min(0).max(240),
    readableText: z.boolean(), motion: z.boolean(), sound: z.boolean(), freeBrowse: z.boolean(), autoSubmit: z.boolean() };
  for (const [key, entry] of Object.entries(entries)) if (entry && !schemas[key].safeParse(entry.value).success)
    context.addIssue({ code: "custom", path: [key], message: "Invalid preference value." });
});
const draft = z.object({ code: z.string().max(20_000), updatedAt: timestamp }).strict();
export const importedSolve = z.object({ problemId, languages: z.array(languageKey).max(3),
  firstSolvedAt: timestamp, bestRuntimeMs: z.number().nonnegative().optional() }).strict();
export const progressPatch = z.object({
  drafts: boundedRecord(z.string().regex(/^[a-z0-9-]{1,100}_(java|javascript|typescript|python)$/), draft).default({}),
  preferences: preferences.default({}),
  foundationProgress: foundationProgress.default({}),
  unverifiedSolves: z.array(importedSolve).max(5000).default([]),
}).strict();
export const deviceImport = z.object({ version: z.literal(1), sourceSchemaVersion: z.literal(6), data: progressPatch }).strict();
export type ProgressPatch = z.infer<typeof progressPatch>;
export type DeviceImport = z.infer<typeof deviceImport>;
export const accountPatch = z.object({ handle: handleSchema.optional(), leaderboardOptIn: z.boolean().optional() }).strict();
export interface AccountUser { id: string; name: string; handle: string | null; avatar: string; avatarUrl?: string; leaderboardOptIn: boolean }
export interface AccountProgress extends ProgressPatch { updatedAt: number }
export function mergeProgress(current: AccountProgress, incoming: ProgressPatch): AccountProgress {
  const drafts = { ...current.drafts }, preferences = { ...current.preferences };
  for (const [key, value] of Object.entries(incoming.drafts)) if (!drafts[key] || value.updatedAt > drafts[key].updatedAt) drafts[key] = value;
  for (const [key, value] of Object.entries(incoming.preferences)) {
    const preferenceName = key as keyof typeof preferences;
    if (!preferences[preferenceName] || value.updatedAt > preferences[preferenceName]!.updatedAt) preferences[preferenceName] = value;
  }
  const foundations = structuredClone(current.foundationProgress);
  for (const [topicId, topic] of Object.entries(incoming.foundationProgress)) {
    const previous = foundations[topicId];
    const steps = { ...topic.steps, ...previous?.steps };
    for (const [id, step] of Object.entries(topic.steps)) {
      const before = previous?.steps[id];
      steps[id] = before ? { ...((step.updatedAt ?? 0) > (before.updatedAt ?? 0) ? step : before), completed: before.completed || step.completed,
        hintsUsed: Math.max(before.hintsUsed, step.hintsUsed), attempts: Math.max(before.attempts, step.attempts) } : step;
    }
    foundations[topicId] = { steps, completed: !!previous?.completed || topic.completed };
  }
  // Solves are persisted in their dedicated collection, never trusted as verified.
  const same = JSON.stringify([drafts, preferences, foundations]) === JSON.stringify([current.drafts, current.preferences, current.foundationProgress]);
  return { drafts, preferences, foundationProgress: foundations, unverifiedSolves: [], updatedAt: same ? current.updatedAt : Date.now() };
}
