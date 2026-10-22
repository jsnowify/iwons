"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { signOut } from "next-auth/react";
import { DEFAULT_SETTINGS, useStore } from "@/store/use-store";
import { storage } from "@/lib/storage";
import { adaptDevice } from "@/lib/accounts/device-import";
import { filterImportablePayload } from "@/lib/accounts/importable";
import { importableProblemIds } from "@/lib/accounts/catalog-ids";
import { progressPatch, type AccountUser, type AccountProgress, type DeviceImport } from "@/lib/accounts/contracts";
import type { Settings, Submission } from "@/lib/types";
import { verdict } from "@/lib/judge0/contracts";

const accountResponse = z.object({ user: z.object({ id: z.string(), name: z.string(), handle: z.string().nullable(),
  avatar: z.string(), avatarUrl: z.string().regex(/^\/api\/me\/avatar\/\?v=[a-f0-9]{32}$/).optional(), leaderboardOptIn: z.boolean() }).nullable(), providers: z.array(z.string()), credentials: z.boolean().default(false) });
const syncedProgress = progressPatch.extend({ updatedAt: z.number() });
const serverHistory = z.array(z.object({ _id: z.string(), problemId: z.string(), code: z.string().max(20_000),
  language: z.enum(["java", "python", "javascript"]), verdict, passed: z.number(), total: z.number(), runtimeMs: z.number(), createdAt: z.string() }));
async function loadHistory() {
  const rows = serverHistory.parse(await accountRequest("/api/me/submissions/"));
  const submissions: Submission[] = rows.map(row => ({ source: "server", id: row._id, problemId: row.problemId, code: row.code, language: row.language,
    verdict: row.verdict, passed: row.passed, total: row.total, runtimeMs: row.runtimeMs, at: Date.parse(row.createdAt),
    timeSpentMs: 0, mode: "practice", hintsUsed: 0, viewedEditorial: false, results: [],
    integrity: { score: 0, tabSwitches: 0, totalAwayMs: 0, pastes: 0, largestPasteChars: 0, fullscreenExits: 0, browser: "", events: [] } }));
  const recent = new Set(submissions.map(item => item.id));
  useStore.setState({ submissions: [...submissions, ...useStore.getState().submissions.filter(item => !recent.has(item.id))]
    .sort((a, b) => b.at - a.at) });
}
export async function accountRequest(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const response = await fetch(path, { method, credentials: "same-origin", cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(storage.accountId() ? { "X-Iwons-Account": storage.accountId()! } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(data);
    throw new Error(error.success ? error.data.error : "Account services are unavailable. Your local changes are saved.");
  }
  return data;
}
function deviceSnapshot() {
  const drafts: Record<string, string> = {};
  for (const key of storage.keys()) {
    const match = /^drafts:([^:]+):(javascript|typescript|python|java)$/.exec(key);
    if (match) drafts[`${match[1]}_${match[2]}`] = storage.read(key, "");
  }
  return adaptDevice(useStore.getState(), drafts, storage.syncTimes());
}
function applyProgress(data: AccountProgress) {
  const state = useStore.getState();
  const preferences = Object.fromEntries(Object.entries(data.preferences).map(([key, entry]) => [key, entry!.value])) as Partial<Settings>;
  useStore.setState({ settings: { ...state.settings, ...preferences }, topicFoundations: data.foundationProgress,
    progress: Object.fromEntries(data.unverifiedSolves.map(item => [item.problemId, true])) });
  const times = storage.syncTimes();
  for (const [key, entry] of Object.entries(data.drafts)) {
    const split = key.lastIndexOf("_");
    storage.write(`drafts:${key.slice(0, split)}:${key.slice(split + 1)}`, entry.code);
    times[`drafts:${key}`] = entry.updatedAt;
  }
  for (const [key, entry] of Object.entries(data.preferences)) times[`settings:${key}`] = entry!.updatedAt;
  for (const [topicId, topic] of Object.entries(data.foundationProgress)) for (const [id, step] of Object.entries(topic.steps))
    times[`foundation:${topicId}:${id}`] = step.updatedAt ?? 0;
  storage.setSyncTimes(times);
}
export type SyncState = "pending" | "syncing" | "synced" | "error";
export interface ImportSummary { solves: number; drafts: number; lessons: number; preferences: boolean; skipped: number }
function summarize(snapshot: DeviceImport): ImportSummary {
  const { data, skipped } = filterImportablePayload(snapshot.data, importableProblemIds);
  return { skipped, solves: data.unverifiedSolves.length, drafts: Object.keys(data.drafts).length,
    lessons: Object.values(data.foundationProgress).reduce((sum, topic) => sum + Object.values(topic.steps).filter(step => step.completed).length, 0),
    preferences: Object.entries(data.preferences).some(([key, entry]) => entry!.value !== DEFAULT_SETTINGS[key as keyof Settings]) };
}
interface AccountContextValue {
  ready: boolean; progressVersion: number; syncState: SyncState; importSummary: ImportSummary | null;
  user: AccountUser | null; providers: string[]; credentialAccount: boolean; error: string; importing: boolean; hasImport: boolean;
  refresh: () => Promise<void>; refreshIdentity: () => Promise<void>; importDevice: () => Promise<void>; skipImport: () => void; logout: () => Promise<void>;
}
const Context = createContext<AccountContextValue>({ ready: false, progressVersion: 0, syncState: "synced", importSummary: null,
  user: null, providers: [], credentialAccount: false, error: "", importing: false, hasImport: false,
  refresh: async () => {}, refreshIdentity: async () => {}, importDevice: async () => {}, skipImport: () => {}, logout: async () => {} });
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const hydrated = useStore(state => state.hydrated);
  const [ready, setReady] = useState(false), [progressVersion, setProgressVersion] = useState(0);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [credentialAccount, setCredentialAccount] = useState(false);
  const [error, setError] = useState("");
  const [hasImport, setHasImport] = useState(false), [importing, setImporting] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("synced");
  const pendingImport = useRef<DeviceImport | null>(null), muted = useRef(false), revision = useRef(0);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    if (!hydrated) return;
    let active = true, timer: ReturnType<typeof setTimeout> | undefined, busy = false;
    async function flush() {
      if (!storage.accountId() || muted.current || !storage.syncPending()) return;
      if (busy) { timer = setTimeout(() => void flush(), 1500); return; }
      busy = true; const version = revision.current;
      if (active) setSyncState("syncing");
      try {
        const data = syncedProgress.parse(await accountRequest("/api/me/progress/", "PUT", deviceSnapshot().data));
        if (active && version === revision.current) {
          muted.current = true; applyProgress(data); muted.current = false;
          storage.syncPending(false); setError(""); setSyncState("synced");
        }
      } catch (cause) {
        if (active) { setError(cause instanceof Error ? cause.message : "Changes are saved locally; sync will retry."); setSyncState("error"); timer = setTimeout(() => void flush(), 15_000); }
      } finally { busy = false; }
    }
    flushRef.current = flush;
    async function initialize() {
      let offerImport = false;
      try {
        const session = accountResponse.parse(await accountRequest("/api/me/"));
        if (!active) return;
        setProviders(session.providers); setUser(session.user); setCredentialAccount(session.credentials);
        if (!session.user) return;
        if (!session.credentials && !storage.syncChoice(session.user.id)) {
          pendingImport.current = deviceSnapshot();
          offerImport = Object.keys(pendingImport.current.data.drafts).length > 0 || pendingImport.current.data.unverifiedSolves.length > 0 ||
            Object.keys(pendingImport.current.data.foundationProgress).length > 0 || Object.entries(pendingImport.current.data.preferences)
              .some(([key, entry]) => entry!.value !== DEFAULT_SETTINGS[key as keyof Settings]);
        }
        muted.current = true;
        storage.switchAccount(session.user.id);
        await useStore.persist.rehydrate();
        useStore.setState({ profile: { name: session.user.name, avatar: session.user.avatar, onboarded: true } });
        if (storage.syncPending()) { muted.current = false; await flush(); }
        else {
          const data = syncedProgress.parse(await accountRequest("/api/me/progress/"));
          if (active) applyProgress(data);
        }
        muted.current = false;
        if (active) setHasImport(offerImport);
        if (active) await loadHistory();
      } catch (cause) {
        muted.current = false;
        if (active) setError(cause instanceof Error ? cause.message : "Account services are unavailable.");
      } finally { if (active) { setReady(true); setProgressVersion(value => value + 1); } }
    }
    function onWrite(event: Event) {
      const detail = (event as CustomEvent<{ key: string }>).detail;
      if (muted.current || !storage.accountId() || !detail ||
        !["settings", "topicFoundations", "progress"].includes(detail.key) && !detail.key.startsWith("drafts:")) return;
      revision.current++; storage.syncPending(true); setSyncState(state => state === "error" ? state : "pending");
      clearTimeout(timer); timer = setTimeout(() => void flush(), 1000);
    }
    window.addEventListener("iwons:data-write", onWrite);
    window.addEventListener("online", flush);
    async function checkSession() {
      try {
        const session = accountResponse.parse(await accountRequest("/api/me/"));
        if (active && session.user?.id !== (storage.accountId() ?? undefined)) window.location.reload();
        else await flush();
      } catch { /* An offline focus change must not discard cached drafts. */ }
    }
    window.addEventListener("focus", checkSession);
    void initialize();
    return () => { active = false; clearTimeout(timer); window.removeEventListener("iwons:data-write", onWrite); window.removeEventListener("online", flush); window.removeEventListener("focus", checkSession); };
  }, [hydrated]);
  async function refreshIdentity() {
    const session = accountResponse.parse(await accountRequest("/api/me/"));
    if (session.user?.id !== storage.accountId()) { window.location.reload(); return; }
    setUser(session.user); setCredentialAccount(session.credentials);
  }
  async function refresh() {
    if (!user) return;
    const session = accountResponse.parse(await accountRequest("/api/me/")); setUser(session.user);
    if (session.user?.id !== storage.accountId()) { window.location.reload(); return; }
    await flushRef.current();
    if (!storage.syncPending()) {
      muted.current = true;
      try { applyProgress(syncedProgress.parse(await accountRequest("/api/me/progress/"))); }
      finally { muted.current = false; }
      await loadHistory();
      setProgressVersion(value => value + 1);
    }
  }
  async function importDevice() {
    if (!user || !pendingImport.current || importing) return;
    setImporting(true);
    try {
      const data = syncedProgress.parse(await accountRequest("/api/sync/import/", "POST", pendingImport.current));
      muted.current = true; applyProgress(data); muted.current = false;
      setProgressVersion(value => value + 1);
      storage.syncChoice(user.id, true); setHasImport(false); pendingImport.current = null; setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed. Your device data is safe."); }
    finally { setImporting(false); muted.current = false; }
  }
  function skipImport() { if (user) storage.syncChoice(user.id, true); setHasImport(false); pendingImport.current = null; }
  async function logout() {
    if (credentialAccount) {
      await flushRef.current();
      await accountRequest("/api/auth/logout/", "POST");
      muted.current = true;
      storage.switchAccount(null); await useStore.persist.rehydrate();
      setUser(null); setHasImport(false); pendingImport.current = null; setError("");
      setProgressVersion(value => value + 1); muted.current = false;
      return;
    }
    await flushRef.current(); muted.current = true;
    storage.switchAccount(null); await useStore.persist.rehydrate();
    await signOut({ callbackUrl: "/settings/" });
  }
  const importSummary = hasImport && pendingImport.current ? summarize(pendingImport.current) : null;
  return <Context.Provider value={{ ready, progressVersion, syncState, importSummary, user, providers, credentialAccount, error, hasImport, importing, refresh, refreshIdentity, importDevice, skipImport, logout }}>{children}</Context.Provider>;
}
