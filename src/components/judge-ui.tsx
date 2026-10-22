"use client";
import { useId, useState, type ReactNode } from "react";
import {
  CircleCheck, CircleX, Hourglass, Hammer, TriangleAlert, ServerCrash, Lock, ChevronDown, Copy, Check,
  WifiOff, RefreshCw, Clock, type LucideIcon,
} from "lucide-react";
import type { PublicJudgeResult } from "@/lib/judge0/contracts";
import { Button } from "./ui";

export type DisplayVerdict = PublicJudgeResult["verdict"];
interface VerdictMeta { label: string; tag: string; tone: "success" | "warning" | "danger" | "info"; icon: LucideIcon; hint: string }
export const verdictMeta: Record<DisplayVerdict, VerdictMeta> = {
  accepted: { label: "Accepted", tag: "All tests passed", tone: "success", icon: CircleCheck,
    hint: "Every test passed. Your approach held up." },
  wrong_answer: { label: "Not quite yet", tag: "Output differs", tone: "danger", icon: CircleX,
    hint: "Your program ran. Compare the expected and actual output below to see where it differed." },
  time_limit: { label: "Needs more speed", tag: "Time limit exceeded", tone: "warning", icon: Hourglass,
    hint: "The logic may be right, but it took too long. Look for repeated work you can skip." },
  compile_error: { label: "Didn’t compile yet", tag: "Compilation error", tone: "warning", icon: Hammer,
    hint: "Start with the first line the compiler mentions. Later errors often disappear once it’s fixed." },
  runtime_error: { label: "Stopped while running", tag: "Runtime error", tone: "danger", icon: TriangleAlert,
    hint: "Your program crashed partway. Check input parsing, array bounds and division by zero." },
  internal_error: { label: "Execution failed on our side", tag: "Not your code", tone: "info", icon: ServerCrash,
    hint: "Something went wrong in the judge, not in your solution. Your draft is saved; try again in a moment." },
};
export function displayVerdict(result: PublicJudgeResult): DisplayVerdict {
  return result.failureSource === "platform" ? "internal_error" : result.verdict;
}

export function VerdictBadge({ verdict, headingId }: { verdict: DisplayVerdict; headingId?: string }) {
  const meta = verdictMeta[verdict];
  return <h2 id={headingId} tabIndex={-1} className={`verdict judge-verdict ${meta.tone}`}>
    <meta.icon size={22} aria-hidden="true" />{meta.label}
  </h2>;
}

export function StatChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return <span className="chip stat-chip"><Icon size={13} aria-hidden="true" /><span className="visually-hidden">{label}: </span>{value}</span>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <Button variant="ghost" className="small" aria-label={copied ? "Copied" : label} onClick={() => {
    void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }, () => {});
  }}>{copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}{copied ? "Copied" : label}</Button>;
}

/** Monospaced, scrollable raw output with a friendly line on top. */
export function ErrorOutput({ hint, output, label }: { hint: string; output: string; label: string }) {
  return <div className="error-output">
    <div className="between"><p>{hint}</p><CopyButton text={output} label={`Copy ${label.toLowerCase()}`} /></div>
    <pre tabIndex={0} aria-label={label}>{output}</pre>
  </div>;
}

const lines = (text: string) => text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
function DiffBlock({ text, other, kind }: { text: string; other: string | null; kind: "expected" | "actual" }) {
  const own = lines(text), compare = other === null ? null : lines(other);
  return <pre>{own.map((line, index) => {
    const differs = compare !== null && compare[index]?.trimEnd() !== line.trimEnd();
    return <span key={index} className={differs ? `diff-line ${kind}` : undefined}>
      {differs ? <span className="visually-hidden">{kind === "actual" ? "Differs: " : "Expected here: "}</span> : null}
      {line || " "}{"\n"}</span>;
  })}</pre>;
}

export interface VisibleCase { id: string; stdin: string; expected: string }
export function TestCaseRow({ index, example, result, defaultOpen }: {
  index: number; example?: VisibleCase; defaultOpen: boolean;
  result: PublicJudgeResult["cases"][number];
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();
  const firstDiff = example && !result.passed && (!result.error || /did not match/i.test(result.error))
    ? lines(result.stdout).findIndex((line, i) => line.trimEnd() !== (lines(example.expected)[i] ?? "").trimEnd()) : -1;
  return <li className={`test-row ${result.passed ? "passed" : "failed"}`}>
    <button type="button" className="test-row-toggle" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
      {result.passed ? <CircleCheck size={16} className="success" aria-hidden="true" /> : <CircleX size={16} className="danger" aria-hidden="true" />}
      <span>Test {index + 1}</span>
      <span className={result.passed ? "success" : "danger"}>{result.passed ? "Passed" : "Not yet"}</span>
      <span className="muted test-row-time">{result.runtimeMs.toFixed(0)} ms</span>
      <ChevronDown size={14} className="test-row-chevron" aria-hidden="true" />
    </button>
    <div id={panel} className="test-row-body" hidden={!open}>
      {firstDiff >= 0 ? <p className="muted">First difference on line {firstDiff + 1}.</p> : null}
      <div className="case-fields program-case-fields">
        {example ? <div className="case-field"><label>Input</label><pre>{example.stdin}</pre></div> : null}
        {example ? <div className="case-field"><label>Expected</label><DiffBlock text={example.expected} other={null} kind="expected" /></div> : null}
        <div className="case-field"><label>Your output</label>
          {result.stdout ? <DiffBlock text={result.stdout} other={example && !result.passed ? example.expected : null} kind="actual" />
            : <pre className="muted">(no output)</pre>}</div>
      </div>
      {/* A plain mismatch is already shown by the diff; short notes read better as text than as a log. */}
      {!result.error || (example && /did not match/i.test(result.error)) ? null
        : result.error.includes("\n") || result.error.length > 160
          ? <ErrorOutput label="Error details" hint="Here’s what the judge reported for this test:" output={result.error} />
          : <p className="muted">{result.error}</p>}
    </div>
  </li>;
}

export function HiddenTestsRow({ passed, total, statuses }: { passed: number; total: number; statuses?: PublicJudgeResult["hiddenCases"] }) {
  if (total <= 0) return null;
  const all = passed === total;
  return <><li className={`test-row hidden-tests ${all ? "passed" : "failed"}`}>
    <div className="test-row-toggle" role="group" aria-label="Hidden tests">
      <Lock size={16} aria-hidden="true" />
      <span>Hidden tests</span>
      <span className={all ? "success" : "danger"}>{passed} of {total} passed</span>
      <span className="muted test-row-time">Inputs stay private</span>
    </div>
  </li>{statuses?.map(item => <li key={item.index} className={`test-row hidden-tests ${item.status === "passed" ? "passed" : "failed"}`}>
    <div className="test-row-toggle">
      <Lock size={16} aria-hidden="true" /><span>Hidden test #{item.index}:</span>
      <span className={item.status === "passed" ? "success" : "danger"}>{item.status === "passed" ? "Passed" : "Failed"}
        {item.status === "timeout" ? " (timeout)" : item.status === "error" ? " (error)" : ""}</span>
    </div>
  </li>)}</>;
}

export type JudgeProblemKind = "busy" | "rate" | "network" | "timeout" | "server" | "unavailable" | "input";
const problemCopy: Record<JudgeProblemKind, { title: string; body: string; icon: LucideIcon; retry: boolean }> = {
  busy: { title: "We’re busy right now", body: "The judge has a queue. Try again in a few seconds — your draft is saved.", icon: Clock, retry: true },
  rate: { title: "Take a short breather", body: "You’ve run a lot in the last minute. Wait a moment, then try again.", icon: Clock, retry: true },
  network: { title: "Couldn’t reach the judge", body: "Check your connection. Your draft is saved on this device.", icon: WifiOff, retry: true },
  timeout: { title: "Judging took too long", body: "This isn’t about your code. Your draft is saved; try again shortly.", icon: Hourglass, retry: true },
  server: { title: "Execution failed on our side", body: "Something broke in the judge, not in your solution. Please try again.", icon: ServerCrash, retry: true },
  unavailable: { title: "Server judging is offline", body: "It isn’t set up right now. Your work is safe, and local practice still works.", icon: ServerCrash, retry: false },
  input: { title: "Let’s fix one thing first", body: "", icon: TriangleAlert, retry: false },
};
export function JudgeProblem({ kind, detail, onRetry }: { kind: JudgeProblemKind; detail: string; onRetry: () => void }) {
  const copy = problemCopy[kind];
  return <div className="judge-problem error-box" role="alert">
    <copy.icon size={20} aria-hidden="true" />
    <div className="stack">
      <strong>{copy.title}</strong>
      <p>{copy.body || detail}</p>
      {copy.body && detail && kind !== "network" ? <small className="muted">Details: {detail}</small> : null}
      {copy.retry ? <div><Button variant="secondary" className="small" onClick={onRetry}><RefreshCw size={13} aria-hidden="true" />Try again</Button></div> : null}
    </div>
  </div>;
}
