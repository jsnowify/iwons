"use client";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Pause, Square, Play } from "lucide-react";
import { storage } from "@/lib/storage";
import { runServerJudge } from "@/lib/judge-polling";
import { verificationCache, verificationCandidates, type VerificationCache, type VerificationCandidate, type VerificationStatus } from "@/lib/accounts/verification-contracts";
import { SubmitBudget, runVerificationQueue } from "@/lib/accounts/verification-queue";
import { useAccount, accountRequest } from "./account-provider";
import { Button, ProgressBar } from "./ui";

const empty = (): VerificationCache => ({ version: 1, items: {}, starts: [], blockedUntil: 0 });
export function ImportedVerification() {
  const account = useAccount(), owner = account.user?.id;
  const [candidates, setCandidates] = useState<VerificationCandidate[]>([]), [concurrency, setConcurrency] = useState(1);
  const [cache, setCache] = useState<VerificationCache>(empty), [running, setRunning] = useState(false), [note, setNote] = useState("");
  const latest = useRef<VerificationCache>(empty()), controller = useRef<AbortController | null>(null), mounted = useRef(false);
  function save(next: VerificationCache) {
    if (!owner || storage.accountId() !== owner) return;
    latest.current = next; storage.verificationQueue(next);
    if (mounted.current) setCache(next);
  }
  useEffect(() => {
    if (!account.ready || !owner) return;
    mounted.current = true; let active = true;
    const parsed = verificationCache.safeParse(storage.verificationQueue());
    const saved = parsed.success ? parsed.data : empty();
    saved.items = Object.fromEntries(Object.entries(saved.items).map(([id, status]) => [id, status === "running" ? "pending" : status]));
    latest.current = saved; setCache(saved);
    void accountRequest("/api/me/verification/").then(value => {
      const data = verificationCandidates.parse(value);
      if (active) { setCandidates(data.items); setConcurrency(data.concurrency); }
    }).catch(() => { /* Verification is optional; account sync and practice stay available. */ });
    return () => { active = false; mounted.current = false; controller.current?.abort(); };
  }, [account.ready, owner]);
  if (!owner || !candidates.length) return null;
  const eligible = candidates.filter(item => item.reason === "ready" && item.code && item.language);
  const done = eligible.filter(item => ["accepted", "needs_update"].includes(cache.items[item.problemId])).length;
  const pending = eligible.filter(item => !["accepted", "needs_update"].includes(cache.items[item.problemId]));
  const resumable = pending.length > 0 && eligible.some(item => cache.items[item.problemId] !== undefined);
  const missing = candidates.filter(item => item.reason === "missing_code").length;
  const unsupported = candidates.filter(item => item.reason === "unsupported").length;
  async function start() {
    if (controller.current || !owner) return;
    const abort = new AbortController(); controller.current = abort; setRunning(true); setNote("");
    let tasks = pending;
    if (!tasks.length) {
      tasks = eligible.filter(item => latest.current.items[item.problemId] !== "accepted");
      save({ ...latest.current, items: { ...latest.current.items, ...Object.fromEntries(tasks.map(item => [item.problemId, "pending" as const])) } });
    }
    const budget = new SubmitBudget([...latest.current.starts], latest.current.blockedUntil,
      (starts, blockedUntil) => save({ ...latest.current, starts, blockedUntil }));
    try {
      const state = await runVerificationQueue(tasks, { signal: abort.signal, concurrency, budget,
        run: (item, signal) => runServerJudge({ problemId: item.problemId, language: item.language!, code: item.code!, mode: "submit" }, () => {}, signal),
        onItem: (item, status: VerificationStatus) => save({ ...latest.current, items: { ...latest.current.items, [item.problemId]: status } }),
        onWaiting: () => { if (mounted.current) setNote("Waiting for the submit limit. You can pause and resume later."); },
      });
      if (mounted.current) setNote(state.unavailable ? "The judge is unavailable. Verification paused; your progress is saved."
        : state.paused ? "Verification paused. Resume whenever you’re ready." : "Verification finished. Your personal progress is unchanged for anything we couldn’t verify.");
      if (mounted.current && storage.accountId() === owner) await account.refresh().catch(() => {});
    } finally {
      if (controller.current === abort) controller.current = null;
      if (mounted.current) setRunning(false);
    }
  }
  return <div className="stack" aria-label="Imported solve verification" role="region">
    <h3>Verify imported solves</h3>
    <p className="muted">Optional: replay saved code with the server judge. Only accepted results earn verified credit; every imported solve stays in your personal progress.</p>
    {missing ? <p className="muted">{missing} {missing === 1 ? "solve has" : "solves have"} no imported code. Solve {missing === 1 ? "it" : "them"} again to verify.</p> : null}
    {unsupported ? <p className="muted">{unsupported} {unsupported === 1 ? "problem isn’t" : "problems aren’t"} available for server verification yet. Your local progress stays saved.</p> : null}
    <div className="row wrap">
      <Button disabled={running || !eligible.some(item => cache.items[item.problemId] !== "accepted")} onClick={() => void start()}>
        {resumable ? <Play size={14} aria-hidden="true" /> : <ShieldCheck size={14} aria-hidden="true" />}
        {resumable ? "Resume verification" : "Verify my imported solves"}</Button>
      {running ? <><Button variant="secondary" onClick={() => controller.current?.abort()}><Pause size={14} aria-hidden="true" />Pause verification</Button>
        <Button variant="ghost" onClick={() => controller.current?.abort()}><Square size={14} aria-hidden="true" />Stop verification</Button></> : null}
    </div>
    {eligible.length ? <>
      <p role="status" aria-live="polite">{running ? `Verifying ${Math.min(done + 1, eligible.length)} of ${eligible.length}…` : `${done} of ${eligible.length} checked.`} {note}</p>
      <ProgressBar value={done / eligible.length * 100} label="Imported solves checked" />
      <ul className="import-facts">{eligible.map(item => <li key={item.problemId}><span>{item.title}: </span>
        <span>{cache.items[item.problemId] === "accepted" ? "Verified" : cache.items[item.problemId] === "needs_update"
          ? "Couldn’t verify this one yet; your code may need a small update." : cache.items[item.problemId] === "running" ? "Checking…" : "Ready to verify"}</span></li>)}</ul>
    </> : null}
  </div>;
}
