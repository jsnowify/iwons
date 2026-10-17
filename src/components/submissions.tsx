"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics">;
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileClock,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ArrowLeft,
  Code2,
} from "lucide-react";
import { useStore } from "@/store/use-store";
import { verdictNames, languageNames, problemUrl } from "@/lib/presentation";
import { storage } from "@/lib/storage";
import { integrityKind } from "@/lib/watch/badge";
import { Badge, Empty, Button, useToast } from "./ui";
export function SubmissionsPage({problems}:{problems:CatalogEntry[]}) {
  const store = useStore();
  const [status, setStatus] = useState("");
  const list = store.submissions.filter(
    (s) =>
      !status ||
      (status === "accepted"
        ? s.verdict === "accepted"
        : s.verdict !== "accepted"),
  );
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE ATTEMPTS BEHIND THE ANSWER.</div>
          <h1>
            Your practice log<span className="accent">.</span>
          </h1>
          <p>Every version taught you something.</p>
        </div>
        <select
          aria-label="Filter submissions by verdict"
          style={{ width: 150 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All verdicts</option>
          <option value="accepted">Accepted</option>
          <option value="other">Keep trying</option>
        </select>
      </div>
      <div className="problem-table">
        {list.length ? (
          list.map((s) => {
            const p = [...problems, ...store.customProblems].find(
              (p) => p.id === s.problemId,
            );
            return (
              <Link
                href={`/submissions/detail/?id=${s.id}`}
                className="submission-row"
                key={s.id}
              >
                <div>
                  <strong style={{ fontWeight: 500 }}>
                    {p?.title ?? "Custom problem"}
                  </strong>
                  <small
                    className="muted"
                    style={{ display: "block", fontSize: 10, marginTop: 4 }}
                  >
                    {new Date(s.at).toLocaleString()}
                  </small>
                </div>
                <span
                  className={s.verdict === "accepted" ? "success" : "danger"}
                >
                  {verdictNames[s.verdict]}
                </span>
                <span className="muted">{languageNames[s.language]}</span>
                <Badge kind={integrityKind(s.integrity, s.mode === "contest")}>
                  <ShieldCheck size={11} />
                  {integrityKind(s.integrity, s.mode === "contest").replace(
                    /^./,
                    (c) => c.toUpperCase(),
                  )}{" "}
                  · {s.integrity.score}
                </Badge>
                <ArrowUpRight size={15} className="muted" />
              </Link>
            );
          })
        ) : (
          <Empty
            title="Your story starts with an attempt."
            description="Submit a solution to save your code, verdict, and Iwons Watch timeline here."
            action={
              <Link href="/problems/" className="btn">
                Find a problem →
              </Link>
            }
            icon={<FileClock size={22} />}
          />
        )}
      </div>
    </div>
  );
}
export function SubmissionDetail({problems}:{problems:CatalogEntry[]}) {
  const store = useStore(),
    toast = useToast();
  const [id, setId] = useState("");
  useEffect(
    () => setId(new URLSearchParams(location.search).get("id") ?? ""),
    [],
  );
  const s = store.submissions.find((v) => v.id === id);
  if (!store.hydrated)
    return (
      <div className="content">
        <h1 className="sr-only">Submission detail</h1>
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  if (!s)
    return (
      <div className="content">
        <Empty
          title="This submission isn’t on this device."
          description="Submissions are local to the browser where you solved the problem."
          action={
            <Link className="btn secondary" href="/submissions/">
              View your submissions
            </Link>
          }
        />
      </div>
    );
  const p = [...problems, ...store.customProblems].find(
    (p) => p.id === s.problemId,
  );
  const kind = integrityKind(s.integrity, s.mode === "contest");
  const labels: Record<string, string> = {
    tab_hidden: "Left the Iwons tab",
    tab_visible: "Returned to Iwons",
    window_blur: "Window lost focus",
    window_focus: "Window regained focus",
    paste: "Pasted into editor",
    typing_burst: "Large typing burst",
    fullscreen_exit: "Exited fullscreen",
    multi_tab: "Another Iwons tab detected",
    copy_problem: "Copied problem text",
    devtools_hint: "Possible devtools signal · low reliability",
  };
  return (
    <div className="content">
      <Link
        href="/submissions/"
        className="text-link"
        style={{ marginBottom: 24 }}
      >
        <ArrowLeft size={12} />
        All submissions
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {new Date(s.at).toLocaleString()} · {s.mode}
          </div>
          <h1>{p?.title ?? "Custom problem"}</h1>
          <p>
            {languageNames[s.language]} · {s.passed}/{s.total} tests ·{" "}
            {s.runtimeMs.toFixed(2)} ms
          </p>
        </div>
        {p ? (
          <Link
            href={problemUrl(p)}
            className="btn"
            onClick={() => {
              storage.write(`drafts:${s.problemId}:${s.language}`, s.code);
              store.updateSettings({ language: s.language });
              toast("Your submission is ready in the editor.");
            }}
          >
            Re-open in editor <Code2 size={14} />
          </Link>
        ) : null}
      </div>
      <div className="detail-grid">
        <section className="card">
          <div className="card-heading">
            <h2 className={s.verdict === "accepted" ? "success" : "danger"}>
              {verdictNames[s.verdict]}
            </h2>
            <Badge>{languageNames[s.language]}</Badge>
          </div>
          <pre className="code-view">{s.code}</pre>
          <div className="card-heading" style={{ marginTop: 24 }}>
            <h2>Case results</h2>
          </div>
          {s.results.map((r, i) => (
            <details className="hint-item" key={r.id}>
              <summary className={r.passed ? "success" : "danger"}>
                Case {i + 1} · {r.passed ? "Passed" : "Failed"} ·{" "}
                {r.runtimeMs.toFixed(2)} ms
              </summary>
              <pre style={{ marginTop: 12 }}>
                Expected: {JSON.stringify(r.expected)}
                {"\n"}Actual: {r.error || JSON.stringify(r.actual)}
                {r.stdout ? `\nConsole: ${r.stdout}` : ""}
              </pre>
            </details>
          ))}
        </section>
        <div className="stack">
          <section className="card">
            <div className="card-heading">
              <h2>
                <ShieldCheck size={16} />
                Iwons Watch
              </h2>
              <Badge kind={kind}>
                {kind.charAt(0).toUpperCase() + kind.slice(1)} ·{" "}
                {s.integrity.score}/100
              </Badge>
            </div>
            <div className="field-grid" style={{ fontSize: 12 }}>
              <div className="muted">
                Tab switches{" "}
                <strong className="accent">{s.integrity.tabSwitches}</strong>
              </div>
              <div className="muted">
                Time away{" "}
                <strong>{Math.round(s.integrity.totalAwayMs / 1000)}s</strong>
              </div>
              <div className="muted">
                Pastes <strong>{s.integrity.pastes}</strong>
              </div>
              <div className="muted">
                Fullscreen exits <strong>{s.integrity.fullscreenExits}</strong>
              </div>
            </div>
            <hr />
            <p className="muted" style={{ fontSize: 11 }}>
              Hints used: {s.hintsUsed} · Editorial viewed:{" "}
              {s.viewedEditorial ? "Yes" : "No"}.{" "}
              {kind === "clean" && !s.hintsUsed && !s.viewedEditorial
                ? "This attempt qualifies as clean."
                : "This attempt is recorded with assistance or integrity signals."}
            </p>
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>Session timeline</h2>
            </div>
            {s.integrity.events.length ? (
              <ol className="timeline">
                {s.integrity.events.map((e, i) => (
                  <li key={i}>
                    <small>{new Date(e.t).toLocaleTimeString()}</small>
                    {labels[e.type]}
                    {e.durationMs
                      ? ` · ${Math.round(e.durationMs / 1000)}s away`
                      : ""}
                    {e.type === "paste"
                      ? ` · ${e.meta?.chars} characters, ${e.meta?.lines} lines`
                      : ""}
                    {e.selfReport ? (
                      <span className="chip" style={{ marginLeft: 8 }}>
                        {e.selfReport.replaceAll("_", " ")} · self-reported
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <Empty
                title="A focused session."
                description="No integrity events were recorded."
                icon={<ShieldCheck size={20} />}
              />
            )}
            <details>
              <summary className="text-link">Session browser</summary>
              <p
                className="muted"
                style={{
                  fontSize: 10,
                  overflowWrap: "anywhere",
                  marginTop: 12,
                }}
              >
                {s.integrity.browser}
              </p>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
}
