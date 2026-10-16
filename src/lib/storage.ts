import { validateProblem } from "./validate-problem";
import { migrateV1Data } from "./migrations/v2";
import { migrateV2Data } from "./migrations/v3";
import { migrateV3Data } from "./migrations/v4";
import { validateFoundationsProgress } from "./foundations/validate-progress";
import { isLessonLanguage } from "./foundations/translations";
import { emptyFoundationsProgress } from "./foundations/types";
import type { LegacyArchive } from "./types";
const PREFIX = "iwons:v4:",
  PATH_PREFIX = "iwons:v3:",
  PREVIOUS_PREFIX = "iwons:v2:",
  LEGACY_PREFIX = "iwons:v1:";
let migrationReady = false;
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function finite(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}
function validateImport(data: Record<string, unknown>) {
  if (data.foundations !== undefined) validateFoundationsProgress(data.foundations);
  if (record(data.settings) && data.settings.lessonLanguage !== undefined && !isLessonLanguage(data.settings.lessonLanguage)) throw new Error("Invalid lesson language in backup.");
  const p = data.profile;
  if (
    p !== undefined &&
    (!record(p) ||
      typeof p.name !== "string" ||
      typeof p.avatar !== "string" ||
      typeof p.onboarded !== "boolean")
  )
    throw new Error("Invalid profile in backup.");
  const settings = data.settings;
  if (
    settings !== undefined &&
    (!record(settings) ||
      !["dark", "light"].includes(String(settings.theme)) ||
      !["javascript", "typescript", "python", "java"].includes(
        String(settings.language),
      ) ||
      !finite(settings.fontSize) ||
      !finite(settings.tabSize))
  )
    throw new Error("Invalid editor settings in backup.");
  if (
    record(data.notes) &&
    Object.values(data.notes).some((v) => typeof v !== "string")
  )
    throw new Error("Invalid notes in backup.");
  if (
    record(data.progress) &&
    Object.values(data.progress).some((v) => typeof v !== "boolean")
  )
    throw new Error("Invalid solve progress in backup.");
  if (
    Array.isArray(data.lists) &&
    data.lists.some(
      (l) =>
        !record(l) ||
        typeof l.id !== "string" ||
        typeof l.name !== "string" ||
        !Array.isArray(l.problemIds) ||
        l.problemIds.some((id) => typeof id !== "string"),
    )
  )
    throw new Error("Invalid problem lists in backup.");
  if (
    Array.isArray(data.srs) &&
    data.srs.some(
      (r) =>
        !record(r) ||
        typeof r.problemId !== "string" ||
        !Number.isInteger(r.step) ||
        Number(r.step) < 0 ||
        Number(r.step) > 4 ||
        !finite(r.due),
    )
  )
    throw new Error("Invalid review queue in backup.");
  if (Array.isArray(data.customProblems))
    for (const problem of data.customProblems) validateProblem(problem);
  if (
    Array.isArray(data.submissions) &&
    data.submissions.some(
      (s) =>
        !record(s) ||
        typeof s.id !== "string" ||
        typeof s.problemId !== "string" ||
        typeof s.code !== "string" ||
        !finite(s.at) ||
        !["javascript", "typescript", "python", "java"].includes(
          String(s.language),
        ) ||
        ![
          "accepted",
          "wrong_answer",
          "runtime_error",
          "compile_error",
          "time_limit",
        ].includes(String(s.verdict)) ||
        !Array.isArray(s.results) ||
        !record(s.integrity) ||
        !finite(s.integrity.score) ||
        !Array.isArray(s.integrity.events) ||
        s.integrity.events.some(
          (e) => !record(e) || typeof e.type !== "string" || !finite(e.t),
        ),
    )
  )
    throw new Error("Invalid submission history in backup.");
  if (record(data.sessions) && data.sessions.contest !== undefined) {
    const s = data.sessions.contest;
    if (
      !record(s) ||
      typeof s.id !== "string" ||
      !Array.isArray(s.problemIds) ||
      s.problemIds.some((id) => typeof id !== "string") ||
      !finite(s.startedAt) ||
      !finite(s.endsAt) ||
      typeof s.finished !== "boolean"
    )
      throw new Error("Invalid contest session in backup.");
  }
}

export const DATA_KEYS = [
  "profile",
  "settings",
  "submissions",
  "notes",
  "srs",
  "lists",
  "customProblems",
  "sessions",
  "achievements",
  "progress",
  "plans",
  "archive",
  "foundations",
] as const;
function available() {
  return typeof window !== "undefined";
}
function failure(error: unknown) {
  if (available())
    window.dispatchEvent(
      new CustomEvent("iwons:storage-error", {
        detail: error instanceof Error ? error.message : "Storage unavailable",
      }),
    );
}
function allKeys() {
  if (!available()) return [];
  try {
    return Object.keys(window.localStorage).filter(
      (k) => [PREFIX, PATH_PREFIX, PREVIOUS_PREFIX, LEGACY_PREFIX].some(prefix => k.startsWith(prefix)),
    );
  } catch {
    return [];
  }
}
function readRaw<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}
function namespace(prefix: string) {
  return Object.fromEntries(
    allKeys()
      .filter((k) => k.startsWith(prefix))
      .map((k) => [k.slice(prefix.length), readRaw(k, null)]),
  );
}
function resolveArchive(archive: LegacyArchive, depth = 0): LegacyArchive {
  if (depth > 3) throw new Error("Archive nesting exceeds supported editions.");
  const source = archive.schemaVersion === 2 ? PREVIOUS_PREFIX : LEGACY_PREFIX;
  const data = { ...(archive.data ?? namespace(source)) };
  if (record(data.archive)) data.archive = resolveArchive(data.archive as unknown as LegacyArchive, depth + 1);
  return { schemaVersion: archive.schemaVersion, migratedAt: archive.migratedAt, data };
}
function setRaw(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
function validateEnvelope(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    if (
      !DATA_KEYS.includes(key as (typeof DATA_KEYS)[number]) &&
      key !== "schemaVersion" &&
      !/^drafts:[\w-]+:(javascript|typescript|python|java)$/.test(key)
    )
      throw new Error("Unknown data key: " + key);
    if (
      [
        "submissions",
        "srs",
        "lists",
        "customProblems",
        "achievements",
      ].includes(key) &&
      !Array.isArray(value)
    )
      throw new Error("Invalid " + key + " data.");
    if (
      [
        "profile",
        "settings",
        "notes",
        "plans",
        "sessions",
        "progress",
      ].includes(key) &&
      !record(value)
    )
      throw new Error("Invalid " + key + " data.");
    if (key.startsWith("drafts:") && typeof value !== "string")
      throw new Error("Invalid draft.");
  }
  if (
    data.archive !== undefined &&
    data.archive !== null &&
    (!record(data.archive) ||
      ![1, 2].includes(Number(data.archive.schemaVersion)) ||
      !record(data.archive.data))
  )
    throw new Error("Invalid legacy archive.");
  validateImport(data);
}
export const storage = {
  read<T>(key: string, fallback: T): T {
    return available() ? readRaw(PREFIX + key, fallback) : fallback;
  },
  write(key: string, value: unknown) {
    if (!available()) return false;
    if (this.read<number>("schemaVersion", 0) !== 4 && !this.migrate()) return false;
    try {
      setRaw(PREFIX + key, value);
      return true;
    } catch (e) {
      failure(e);
      return false;
    }
  },
  remove(key: string) {
    try {
      if (available()) window.localStorage.removeItem(PREFIX + key);
    } catch (e) {
      failure(e);
    }
  },
  keys() {
    return allKeys()
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  },
  usage() {
    return allKeys().reduce(
      (n, k) =>
        n + k.length * 2 + (window.localStorage.getItem(k)?.length ?? 0) * 2,
      0,
    );
  },
  readArchive(): LegacyArchive | null {
    const archive = this.read<LegacyArchive | null>("archive", null);
    if (!archive) return null;
    return resolveArchive(archive);
  },
  export() {
    const current = this.read<number>("schemaVersion", 0) === 4;
    const pathEdition = Object.keys(namespace(PATH_PREFIX)).length > 0;
    const previous = Object.keys(namespace(PREVIOUS_PREFIX)).length > 0;
    const data: Record<string, unknown> = current
      ? namespace(PREFIX)
      : namespace(pathEdition ? PATH_PREFIX : previous ? PREVIOUS_PREFIX : LEGACY_PREFIX);
    if (current && data.archive) data.archive = this.readArchive();
    else if (data.archive) data.archive = resolveArchive(data.archive as LegacyArchive);
    return JSON.stringify(
      {
        app: "Iwons",
        schemaVersion: current ? 4 : pathEdition ? 3 : previous ? 2 : 1,
        exportedAt: new Date().toISOString(),
        data,
      },
      null,
      2,
    );
  },
  import(text: string) {
    const doc: unknown = JSON.parse(text);
    if (
      !record(doc) ||
      doc.app !== "Iwons" ||
      ![1, 2, 3, 4].includes(doc.schemaVersion as number) ||
      !record(doc.data)
    )
      throw new Error("Choose an Iwons version 1, 2, 3 or 4 backup.");
    let data = doc.data;
    validateEnvelope(data);
    if (doc.schemaVersion === 1)
      data = migrateV1Data(data, {
        schemaVersion: 1,
        migratedAt: Date.now(),
        data,
      });
    else if (doc.schemaVersion === 2)
      data = migrateV2Data(data, { schemaVersion: 2, migratedAt: Date.now(), data });
    if (doc.schemaVersion !== 4) data = migrateV3Data(data);
    else data = { ...data, foundations: data.foundations ?? emptyFoundationsProgress() };
    if (record(data.settings))
      data.settings = {
        readableText: false,
        motion: true,
        sound: false,
        freeBrowse: false,
        lessonLanguage: "en",
        ...data.settings,
      };
    const backup = Object.fromEntries(
      allKeys().map((k) => [k, window.localStorage.getItem(k)!]),
    );
    try {
      // Replace the active edition, retaining the original v1/v2/v3 namespaces.
      for (const key of allKeys().filter(key => key.startsWith(PREFIX))) window.localStorage.removeItem(key);
      for (const [key, value] of Object.entries({ ...data, schemaVersion: 4 }))
        setRaw(PREFIX + key, value);
      migrationReady = true;
    } catch (e) {
      for (const key of allKeys()) window.localStorage.removeItem(key);
      for (const [key, value] of Object.entries(backup))
        window.localStorage.setItem(key, value);
      failure(e);
      throw new Error("Not enough storage. Your original data was restored.");
    }
  },
  clear() {
    for (const key of allKeys()) window.localStorage.removeItem(key);
    migrationReady = false;
  },
  migrate() {
    if (!available()) return false;
    if (this.read<number>("schemaVersion", 0) === 4) {
      migrationReady = true;
      return true;
    }
    const before = Object.fromEntries(allKeys().filter(key => key.startsWith(PREFIX)).map(key => [key, window.localStorage.getItem(key)!]));
    try {
      const currentPath = namespace(PATH_PREFIX), previous = namespace(PREVIOUS_PREFIX), old = namespace(LEGACY_PREFIX);
      let migrated: Record<string, unknown> = {};
      if (Object.keys(currentPath).length) {
        migrated = currentPath;
      } else if (Object.keys(previous).length) {
        const next = migrateV2Data(previous, { schemaVersion: 2, migratedAt: Date.now(), sourcePrefix: PREVIOUS_PREFIX });
        migrated = next;
      } else if (Object.keys(old).length) {
        const next = migrateV1Data(old, {
          schemaVersion: 1,
          migratedAt: Date.now(),
          sourcePrefix: LEGACY_PREFIX,
        });
        migrated = next;
      }
      for (const [key, value] of Object.entries(migrateV3Data(migrated))) if (key !== "schemaVersion") setRaw(PREFIX + key, value);
      setRaw(PREFIX + "schemaVersion", 4);
      migrationReady = true;
      return true;
    } catch (e) {
      for (const key of allKeys())
        if (key.startsWith(PREFIX))
          window.localStorage.removeItem(key);
      for (const [key, value] of Object.entries(before)) window.localStorage.setItem(key, value);
      migrationReady = false;
      failure(e);
      return false;
    }
  },
};
export function downloadExport() {
  const url = URL.createObjectURL(
    new Blob([storage.export()], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download =
    "Iwons-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
