"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Cpu, Gauge, ListChecks, Play, RotateCcw, Send, Trophy, X } from "lucide-react";
import { useStore } from "@/store/use-store";
import { storage } from "@/lib/storage";
import { runServerJudge, JudgeRequestError, JudgeCanceledError } from "@/lib/judge-polling";
import type { JudgeLanguage, PublicJudgeResult } from "@/lib/judge0/contracts";
import { Badge, Button, EditorSkeleton, Modal, ProgressBar } from "./ui";
import { useAccount } from "./account-provider";
import { SyncStatus } from "./sync-status";
import { ErrorRetry, ListSkeleton, RoomNote, RoomsGate } from "./rooms-ui";
import { VerdictBadge, StatChip, TestCaseRow, HiddenTestsRow, ErrorOutput, JudgeProblem, displayVerdict, verdictMeta, type JudgeProblemKind } from "./judge-ui";
import { api, roomPath, useResource, type ProblemDetail } from "@/lib/rooms/client";

const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <EditorSkeleton /> });
type Mode = "run" | "submit";
const names: Record<JudgeLanguage, string> = { java: "Java", python: "Python", javascript: "JavaScript" };
const glyphs: Record<JudgeLanguage, string> = { java: "Jv", python: "Py", javascript: "JS" };

function classify(cause: unknown): { kind: JudgeProblemKind; detail: string } {
  const detail = cause instanceof Error ? cause.message : "";
  if (cause instanceof JudgeRequestError) {
    if (cause.status === 429) return { kind: "rate", detail };
    if (cause.status >= 500) return { kind: /not available/i.test(detail) ? "unavailable" : /busy|quota|queue/i.test(detail) ? "busy" : "server", detail };
    return { kind: "input", detail };
  }
  if (cause instanceof TypeError) return { kind: "network", detail };
  if (/longer than a minute/i.test(detail)) return { kind: "timeout", detail };
  return { kind: "server", detail: "" };
}
const formatMemory = (kb: number) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;

function Workspace({ code, problem }: { code: string; problem: ProblemDetail }) {
  const account = useAccount(), hydrated = useStore(state => state.hydrated);
  const languages = problem.languages as JudgeLanguage[];
  const [language, setLanguage] = useState<JudgeLanguage>(languages[0]);
  const [source, setSource] = useState(problem.starters[language]);
  const [running, setRunning] = useState<Mode | null>(null), [status, setStatus] = useState(""), [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ value: PublicJudgeResult; mode: Mode } | null>(null);
  const [problemState, setProblemState] = useState<{ kind: JudgeProblemKind; detail: string; mode: Mode } | null>(null);
  const [note, setNote] = useState(""), [resetting, setResetting] = useState(false);
  const controller = useRef<AbortController | null>(null), resultsRef = useRef<HTMLDivElement>(null), executeRef = useRef<(mode: Mode) => void>(() => {});
  const closed = problem.status === "ended", ready = hydrated && account.ready;
  const draftKey = `drafts:${problem.refKey}:${language}`;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (ready) setSource(storage.read(draftKey, problem.starters[language])); }, [ready, account.progressVersion, draftKey, language, problem]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") return;
      event.preventDefault(); executeRef.current(event.shiftKey ? "submit" : "run");
    };
    // Capture phase: the editor binds Ctrl+Enter itself and would otherwise swallow it.
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, []);
  async function execute(mode: Mode) {
    if (controller.current || !ready || closed) return;
    const abort = new AbortController(); controller.current = abort;
    setRunning(mode); setProblemState(null); setResult(null); setNote(""); setProgress(null);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "nearest" }));
    try {
      const outcome = await runServerJudge({ problemId: problem.refKey, language, code: source, mode, roomId: problem.roomId }, setStatus, abort.signal,
        (done, total) => setProgress({ done, total }), finished => {
          setNote(finished === true ? "This result had already finished and was kept. Your draft is unchanged."
            : finished === false ? "Job canceled. Your draft is unchanged; run again whenever you’re ready." : "We couldn’t confirm cancellation. The job may finish; your draft is unchanged.");
        });
      // Room results live on the server only; nothing is added to your local or global progress.
      if (!abort.signal.aborted) setResult({ value: outcome, mode });
    } catch (cause) {
      if (cause instanceof JudgeCanceledError) setNote(cause.message);
      else if (!abort.signal.aborted) setProblemState({ ...classify(cause), mode });
    } finally {
      if (!abort.signal.aborted) { setRunning(null); setStatus(""); setProgress(null); }
      if (controller.current === abort) controller.current = null;
    }
  }
  executeRef.current = mode => void execute(mode);
  function cancel() {
    controller.current?.abort(); controller.current = null; setRunning(null); setStatus(""); setProgress(null);
    setNote("Cancellation requested. A result that already finished will be kept. Your draft is unchanged.");
  }
  const verdict = result ? displayVerdict(result.value) : null, visible = result?.value.cases ?? [];
  const hiddenTotal = result ? result.value.total - visible.length : 0, hiddenPassed = result ? result.value.passed - visible.filter(item => item.passed).length : 0;
  const firstFailing = visible.findIndex(item => !item.passed), compileOutput = result?.value.verdict === "compile_error" ? result.value.message : "";
  const runningText = progress && progress.total > 0 ? `Running test ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : status || "Sending your code to the judge…";
  const announcement = running ? runningText : result && verdict ? `${verdictMeta[verdict].label}. ${result.value.passed} of ${result.value.total} tests passed.` : "";
  return <section className="card judge-workspace" aria-label="Room problem workspace">
    <p className="muted judge-intro">{closed ? "This room has ended, so submissions are closed. Your drafts are still saved." : "Running code sends it to our judge. Submit counts on this room’s leaderboard only."}</p>
    <div className="judge-editor-bar">
      <label className="judge-language"><span>Language</span>
        <span className="row"><span className="language-glyph" aria-hidden="true">{glyphs[language]}</span>
          <select aria-label="Language" value={language} disabled={!!running} onChange={event => { setLanguage(event.target.value as JudgeLanguage); setResult(null); setProblemState(null); }}>
            {languages.map(item => <option key={item} value={item}>{names[item]}</option>)}</select></span></label>
      <div className="row judge-editor-meta"><SyncStatus />
        <Button variant="ghost" className="small" disabled={!!running || !ready || source === problem.starters[language]} onClick={() => setResetting(true)}><RotateCcw size={13} aria-hidden="true" />Reset to starter</Button></div>
    </div>
    <div className="foundation-editor judge-editor"><CodeEditor code={source} language={language} readOnly={!!running || !ready} onBurst={() => {}}
      onChange={value => { setSource(value); storage.write(draftKey, value); }} /></div>
    <div className="judge-action-bar">
      <span className="shortcut-hint muted"><kbd>⌘ / Ctrl</kbd> <kbd>Enter</kbd> run · add <kbd>Shift</kbd> to submit</span>
      <div className="row">
        {running ? <Button variant="ghost" className="small" onClick={cancel}><X size={13} aria-hidden="true" />Stop waiting</Button> : null}
        <Button variant="secondary" disabled={!ready || !!running || closed} loading={running === "run"} title="Run the examples (⌘ / Ctrl + Enter)" onClick={() => void execute("run")}>{running === "run" ? null : <Play size={14} aria-hidden="true" />}Run</Button>
        <Button disabled={!ready || !!running || closed} loading={running === "submit"} title="Submit for all tests (⌘ / Ctrl + Shift + Enter)" onClick={() => void execute("submit")}>{running === "submit" ? null : <Send size={14} aria-hidden="true" />}Submit</Button>
      </div>
    </div>
    <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
    <div ref={resultsRef} className="judge-results" aria-busy={!!running} aria-label="Judge result" role="region">
      {running ? <div className="judge-running"><p className="mono">{runningText}</p>
        {progress && progress.total > 0 ? <ProgressBar value={(progress.done / progress.total) * 100} label="Tests finished" /> : <div className="progress-track judge-indeterminate" aria-hidden="true"><div className="progress-fill" /></div>}
        <small className="muted">{running === "submit" ? "Checking visible and hidden tests." : "Checking the visible examples."} This usually takes a few seconds.</small></div>
        : problemState ? <JudgeProblem kind={problemState.kind} detail={problemState.detail} onRetry={() => void execute(problemState.mode)} />
          : result && verdict ? <div className="stack judge-result fade-in">
            <div className="judge-result-header"><VerdictBadge verdict={verdict} />
              <div className="row judge-stats">
                <StatChip icon={ListChecks} label="Tests passed" value={`${result.value.passed}/${result.value.total} tests passed`} />
                <StatChip icon={Gauge} label="Runtime" value={`${Math.round(result.value.runtimeMs)} ms`} />
                <StatChip icon={Cpu} label="Memory" value={formatMemory(result.value.memoryKb)} /></div></div>
            <p>{verdict === "accepted" && result.mode === "run" ? "The examples pass. Submit when you’re ready to try the full test set." : verdictMeta[verdict].hint}</p>
            {verdict === "accepted" && result.mode === "submit" ? <p className="first-solve" role="note"><Trophy size={16} aria-hidden="true" />Solved. See where you stand on the <Link className="text-link" href={roomPath(code)}>room leaderboard</Link>.</p> : null}
            {compileOutput ? <ErrorOutput label="Compiler output" hint="The compiler stopped here. Line numbers point to your code:" output={compileOutput} />
              : verdict === "internal_error" ? <div><Button variant="secondary" className="small" onClick={() => void execute(result.mode)}>Try again</Button></div> : null}
            {!compileOutput && (visible.length || hiddenTotal) ? <ul className="test-list" aria-label="Test results">
              {visible.map((item, index) => <TestCaseRow key={`${visible.length}-${item.id}`} index={index} result={item} example={problem.visibleCases.find(example => example.id === item.id)} defaultOpen={index === firstFailing} />)}
              <HiddenTestsRow passed={hiddenPassed} total={hiddenTotal} statuses={result.value.hiddenCases} /></ul> : null}
          </div> : <p className="muted judge-empty">{note || "Run to check the examples, or Submit to try every test. Results appear here."}</p>}
    </div>
    <Modal open={resetting} onClose={() => setResetting(false)} title="Start fresh?">
      <p>This replaces your {names[language]} draft with the starter code. Your other languages keep their drafts.</p>
      <div className="row wrap"><Button onClick={() => { setSource(problem.starters[language]); storage.write(draftKey, problem.starters[language]); setResetting(false); }}>Reset to starter</Button>
        <Button variant="secondary" onClick={() => setResetting(false)}>Keep my code</Button></div>
    </Modal>
  </section>;
}

function RoomProblem({ code, refKey }: { code: string; refKey: string }) {
  const problem = useResource(() => api<ProblemDetail>(`/api/rooms/${code}/problems/${refKey}/`), [code, refKey]);
  const data = problem.data;
  return <div className="content">
    <Link href={roomPath(code)} className="text-link"><ArrowLeft size={13} aria-hidden="true" /> Back to the room</Link>
    {problem.loading && !data ? <ListSkeleton label="Loading the problem" rows={2} />
      : !data ? <ErrorRetry message={problem.error ?? "This problem could not be loaded."} onRetry={problem.reload} />
        : <>
          <div className="page-heading"><div><div className="eyebrow">ROOM PROBLEM</div><h1>{data.title}<span className="accent">.</span></h1>
            <p className="row wrap"><Badge kind={data.difficulty}>{data.difficulty}</Badge>{data.source === "custom" ? <Badge>Custom</Badge> : null}
              <span className="muted">{data.languages.map(item => names[item as JudgeLanguage]).join(", ")}</span></p></div></div>
          <RoomNote />
          <section className="card stack" aria-label="Problem statement">
            <h2>Problem statement</h2>
            {data.statement.split("\n\n").map((paragraph, index) => <p key={index} className="room-statement">{paragraph}</p>)}
            {data.constraints.length ? <ul>{data.constraints.map(item => <li key={item}>{item}</li>)}</ul> : null}
            {data.source === "custom" && data.languages.includes("java") ? <p className="muted">Java reads from standard input and prints to standard output. Keep <code>public class Main</code>.</p> : null}
            {data.source === "catalog" ? <p className="muted">Write the function from the starter. Your code is checked in {data.languages.map(item => names[item as JudgeLanguage]).join(" or ")}.</p> : null}
            {data.visibleCases.map(item => <div key={item.id}><h3>Example</h3><p>Input</p><pre className="code-view">{item.stdin}</pre><p>Output</p><pre className="code-view">{item.expected}</pre></div>)}
          </section>
          <Workspace key={data.refKey} code={code} problem={data} />
        </>}
  </div>;
}
export function RoomProblemWorkspace({ code, refKey }: { code: string; refKey: string }) { return <RoomsGate><RoomProblem code={code} refKey={refKey} /></RoomsGate>; }
