"use client";
import { useCallback, useEffect, useState } from "react";
import { accountRequest } from "@/components/account-provider";

export type Difficulty = "easy" | "medium" | "hard";
export type RoomLanguage = "java" | "python" | "javascript";
export interface RoomSummary { code: string; name: string; role: "host" | "member"; status: "active" | "ended"; hostName: string; memberCount: number;
  maxMembers: number; problemCount: number; startsAt: string | null; endsAt: string | null }
export interface RoomProblem { refKey: string; order: number; title: string; difficulty: Difficulty; source: "catalog" | "custom"; locked?: boolean }
export interface RoomDetail { id: string; code: string; name: string; description: string; hostName: string; role: "host" | "member"; status: "active" | "ended";
  started: boolean; startsAt: string | null; endsAt: string | null; createdAt: string; maxMembers: number; memberCount: number; problemCount: number;
  problems: RoomProblem[]; invite?: { token: string; expiresAt: string | null }; customCount?: number }
export interface RoomMember { username: string; displayName: string; role: "host" | "member"; joinedAt: string; isYou: boolean; userId?: string }
export interface BoardRow { rank: number; username: string; displayName: string; solved: number; lastAcceptedAt: string | null; elapsedMs: number | null; isYou: boolean }
export interface Board { rows: BoardRow[]; you: BoardRow | null; nextCursor: string | null }
export interface RoomMe { rank: number | null; solved: number; lastAcceptedAt: string | null; elapsedMs: number | null;
  problems: { refKey: string; status: "solved" | "attempted" | "not_attempted"; firstAcceptedAt: string | null; elapsedMs: number | null; attempts: number }[] }
export interface CatalogHit { id: string; title: string; difficulty: string; level: number }
export interface CustomTestCase { input: string; expectedOutput: string; isHidden: boolean }
export interface CustomProblem { id: string; title: string; statement: string; difficulty: Difficulty; starterCode: Record<RoomLanguage, string>;
  testCases: CustomTestCase[]; validated: boolean; testsLocked: boolean; updatedAt: string; inRoom?: boolean }
export interface ProblemDetail { refKey: string; source: "catalog" | "custom"; title: string; difficulty: Difficulty; statement: string; constraints: string[];
  languages: RoomLanguage[]; starters: Record<RoomLanguage, string>; visibleCases: { id: string; stdin: string; expected: string }[]; locked: boolean; roomId: string; status: "active" | "ended" }
export interface InvitePreview { name: string; hostName: string; memberCount: number; maxMembers: number; state: "ok" | "expired" | "ended" | "full" }

export const api = <T,>(path: string, method = "GET", body?: unknown) => accountRequest(path, method, body) as Promise<T>;
export const roomPath = (code: string, rest = "") => `/rooms/${code}/${rest}`;
export const messageOf = (cause: unknown, fallback = "Something went wrong. Please try again.") => (cause instanceof Error && cause.message ? cause.message : fallback);

/** Loads data with explicit loading and error states, and a reload that keeps showing the last good data. */
export function useResource<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let active = true;
    setState(current => ({ data: current.data, loading: true }));
    load().then(data => { if (active) setState({ data, loading: false }); })
      .catch(cause => { if (active) setState(current => ({ data: current.data, error: messageOf(cause), loading: false })); });
    return () => { active = false; };
    // The loader is rebuilt every render; callers list what actually changes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);
  const reload = useCallback(() => setNonce(value => value + 1), []);
  return { ...state, reload, setData: (data: T) => setState({ data, loading: false }) };
}

export function formatElapsed(ms: number | null) {
  if (ms === null) return "";
  const total = Math.floor(ms / 1000), hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60;
  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m` : minutes ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}
export const formatWhen = (iso: string | null) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
export const inviteUrl = (token: string) => `${location.origin}/rooms/join/${token}/`;
/** Converts a datetime-local value to an ISO string, or undefined when empty. */
export const localToIso = (value: string) => value ? new Date(value).toISOString() : undefined;
export function isoToLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso), offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
