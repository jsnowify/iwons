import type { LegacyArchive } from "../types";
export function migrateV1Data(
  data: Record<string, unknown>,
  archive: LegacyArchive,
): Record<string, unknown> {
  const custom = Array.isArray(data.customProblems)
    ? (data.customProblems as Record<string, unknown>[])
    : [];
  const ids = new Set(custom.map((p) => String(p.id)));
  const pick = (value: unknown) =>
    Object.fromEntries(
      Object.entries(
        value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {},
      ).filter(([id]) => ids.has(id)),
    );
  const settings =
    data.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};
  const migrated: Record<string, unknown> = {
    profile: data.profile ?? { name: "Coder", avatar: "I", onboarded: false },
    settings: {
      theme: "light",
      language: "javascript",
      fontSize: 14,
      tabSize: 2,
      javaBackend: "remote",
      judgeUrl: "",
      taglish: false,
      countdownMinutes: 0,
      autoSubmit: false,
      ...settings,
      readableText: false,
      motion: true,
      sound: false,
      freeBrowse: false,
    },
    submissions: (Array.isArray(data.submissions)
      ? data.submissions
      : []
    ).filter(
      (s) =>
        s &&
        typeof s === "object" &&
        ids.has(String((s as { problemId?: unknown }).problemId)),
    ),
    progress: pick(data.progress),
    notes: pick(data.notes),
    srs: (Array.isArray(data.srs) ? data.srs : []).filter(
      (r) =>
        r &&
        typeof r === "object" &&
        ids.has(String((r as { problemId?: unknown }).problemId)),
    ),
    lists: (Array.isArray(data.lists) ? data.lists : []).map((l) => ({
      ...l,
      problemIds: (Array.isArray(l.problemIds) ? l.problemIds : []).filter(
        (id: string) => ids.has(id),
      ),
    })),
    customProblems: custom.map((p) => ({
      ...p,
      level: typeof p.level === "number" ? p.level : 0,
      prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites : [],
    })),
    sessions: {},
    achievements: [],
    plans: {},
    archive,
    schemaVersion: 2,
  };
  for (const [key, value] of Object.entries(data))
    if (
      key.startsWith("drafts:") &&
      [...ids].some((id) => key.startsWith(`drafts:${id}:`))
    )
      migrated[key] = value;
  return migrated;
}
