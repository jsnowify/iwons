import type { ProgressPatch } from "./contracts";
export function filterImportablePayload(payload: ProgressPatch, catalogIds: ReadonlySet<string>) {
  const drafts = Object.fromEntries(Object.entries(payload.drafts).filter(([key]) => catalogIds.has(key.slice(0, key.lastIndexOf("_")))));
  const unverifiedSolves = payload.unverifiedSolves.filter(item => catalogIds.has(item.problemId));
  return { data: { ...payload, drafts, unverifiedSolves }, skipped:
    Object.keys(payload.drafts).length - Object.keys(drafts).length + payload.unverifiedSolves.length - unverifiedSolves.length };
}
