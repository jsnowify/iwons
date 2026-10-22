import { deviceImport, type DeviceImport, type ProgressPatch } from "./contracts";
import type { Submission, Settings } from "../types";
import type { TopicFoundationProgress } from "../topic-foundations";

// Non-destructive v6 -> wire-v1 adapter. Legacy timestamps are zero rather than
// invented, so importing an old draft cannot replace a newer account draft.
export function adaptDevice(data: { settings: Settings; progress: Record<string, boolean>; submissions: Submission[];
  topicFoundations: TopicFoundationProgress }, drafts: Record<string, string>, times: Record<string, number>): DeviceImport {
  const preferences: ProgressPatch["preferences"] = {};
  for (const key of ["theme", "language", "fontSize", "tabSize", "readableText", "motion", "sound", "freeBrowse", "countdownMinutes", "autoSubmit"] as const)
    preferences[key] = { value: data.settings[key], updatedAt: times[`settings:${key}`] ?? 0 };
  const unverifiedSolves = Object.entries(data.progress).filter(([, solved]) => solved).map(([problemId]) => {
    const submissions = data.submissions.filter(item => item.problemId === problemId && item.verdict === "accepted");
    const languages = [...new Set(submissions.map(item => item.language).filter((key): key is "java" | "python" | "javascript" => key !== "typescript"))];
    return { problemId, languages, firstSolvedAt: submissions.length ? Math.min(...submissions.map(item => item.at)) : 0,
      ...(submissions.length ? { bestRuntimeMs: Math.min(...submissions.map(item => item.runtimeMs)) } : {}) };
  });
  const foundations = Object.fromEntries(Object.entries(data.topicFoundations).map(([topicId, topic]) => [topicId,
    { ...topic, steps: Object.fromEntries(Object.entries(topic.steps).map(([id, step]) => [id,
      { ...step, updatedAt: times[`foundation:${topicId}:${id}`] ?? 0 }])) }]));
  return deviceImport.parse({ version: 1, sourceSchemaVersion: 6, data: { drafts: Object.fromEntries(Object.entries(drafts).map(([key, code]) =>
    [key, { code, updatedAt: times[`drafts:${key}`] ?? 0 }])), preferences, foundationProgress: foundations, unverifiedSolves } });
}
