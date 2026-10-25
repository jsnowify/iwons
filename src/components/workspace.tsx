"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Download,
  Eye,
  ShieldCheck,
  Timer,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelBottom,
  Square,
  Lock,
  Lightbulb,
  Check,
} from "lucide-react";
import type {
  Problem,
  Language,
  RunResult,
  PrivateProblem,
  TestCase,
  Submission,
} from "@/lib/types";
import { languageNames, verdictNames } from "@/lib/presentation";
import { storage } from "@/lib/storage";
import { useStore } from "@/store/use-store";
import { playBell } from "@/lib/sound";
import { useWatch } from "@/lib/watch/use-watch";
import { ComplexityPanel } from "./complexity-panel";
import { Inline } from "./inline-code";
import { Button, Modal, EditorSkeleton, useToast, Badge } from "./ui";
import { Onboarding } from "./onboarding";
import { useAccount } from "./account-provider";
import { ResultsPanel } from "./results-panel";
const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
export function Workspace({
  problem: p,
  description,
}: {
  problem: Problem;
  description: ReactNode;
}) {
  const store = useStore(),
    toast = useToast();
  const account = useAccount();
  const [language, setLanguage] = useState<Language>("javascript"),
    [code, setCode] = useState(p.starterCode.javascript),
    [loaded, setLoaded] = useState(false),
    [failureInput, setFailureInput] = useState<unknown[] | undefined>(
      undefined,
    ),
    [tab, setTab] = useState("Description"),
    [mobile, setMobile] = useState("description"),
    [focus, setFocus] = useState(false),
    [showDescription, setShowDescription] = useState(true),
    [showResults, setShowResults] = useState(true),
    [split, setSplit] = useState(39),
    [running, setRunning] = useState(false),
    [status, setStatus] = useState(""),
    [result, setResult] = useState<RunResult | null>(null),
    [tests, setTests] = useState<TestCase[]>(p.cases),
    [custom, setCustom] = useState(""),
    [hints, setHints] = useState(0),
    [viewed, setViewed] = useState(false),
    [privateData, setPrivateData] = useState<PrivateProblem | null>(null),
    [error, setError] = useState(""),
    [elapsed, setElapsed] = useState(0),
    [complexity, setComplexity] = useState(false),
    [reset, setReset] = useState(false),
    [onboard, setOnboard] = useState(false);
  const start = useRef(Date.now()),
    lastPaste = useRef(0),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(true),
    bodyRef = useRef<HTMLDivElement>(null),
    runRef = useRef<(submit: boolean) => void>(() => {}),
    autoSubmitted = useRef(false);
  const contest = store.sessions.contest;
  const inContest =
    !!contest && !contest.finished && contest.problemIds.includes(p.id);
  const watch = useWatch(inContest, store.profile.onboarded);
  const logTypingBurst = useCallback(() => {
    if (Date.now() - lastPaste.current > 300) watch.log("typing_burst");
  }, [watch.log]);
  const pastSubmissions = store.submissions.filter((s) => s.problemId === p.id);
  useEffect(() => {
    start.current = Date.now();
    setElapsed(0);
    setHints(0);
    setViewed(false);
    setPrivateData(null);
    setResult(null);
    setTests(p.cases);
    autoSubmitted.current = false;
    watch.reset();
  }, [p.id]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!store.hydrated || !account.ready) return;
    const l = store.settings.language;
    setLanguage(l);
    setCode(storage.read(`drafts:${p.id}:${l}`, p.starterCode[l]));
    setLoaded(true);
    store.setSession({ lastProblem: p.slug });
  }, [store.hydrated, account.ready, account.progressVersion, p.id]);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(
      () => storage.write(`drafts:${p.id}:${language}`, code),
      500,
    );
    return () => clearTimeout(t);
  }, [code, p.id, language, loaded]);
  const draftRef = useRef({ code, language, loaded });
  draftRef.current = { code, language, loaded };
  useEffect(() => {
    const flush = () => {
      const d = draftRef.current;
      if (d.loaded) storage.write(`drafts:${p.id}:${d.language}`, d.code);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [p.id]);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - start.current), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "enter") {
        e.preventDefault();
        runRef.current(e.shiftKey);
      } else if (k === "b") {
        e.preventDefault();
        setShowDescription((v) => !v);
      } else if (k === "j") {
        e.preventDefault();
        setShowResults((v) => !v);
      } else if (e.shiftKey && k === "f") {
        e.preventDefault();
        setFocus((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function loadPrivate() {
    if (privateData) return privateData;
    if (p.id.startsWith("custom-")) {
      const data = p.privateData ?? {
        hiddenCases: [],
        editorialMd: "No editorial was provided for this custom problem.",
      };
      setPrivateData(data);
      return data;
    }
    const response = await fetch(`/problem-data/${p.slug}.json`);
    if (!response.ok)
      throw new Error(
        "Could not load the test pack. Check your connection and try again.",
      );
    const data = (await response.json()) as PrivateProblem;
    setPrivateData(data);
    return data;
  }
  async function execute(submit: boolean, force = false) {
    if (running) return;
    if (!store.profile.onboarded) {
      setOnboard(true);
      return;
    }
    if (inContest && !document.fullscreenElement && !force) {
      setError(
        "Enter fullscreen from the contest lobby before continuing this session.",
      );
      return;
    }
    setRunning(true);
    setShowResults(true);
    setError("");
    controller.current = new AbortController();
    let activeTests = p.cases;
    try {
      if (submit)
        activeTests = [...p.cases, ...(await loadPrivate()).hiddenCases];
      else if (custom.trim()) {
        const data: unknown = JSON.parse(custom);
        if (
          !Array.isArray(data) ||
          data.length > 20 ||
          data.some(
            (c) =>
              !c ||
              typeof c !== "object" ||
              !Array.isArray(c.input) ||
              !("expected" in c),
          )
        )
          throw new Error(
            "Use an array of up to 20 cases, each with input (an array of function arguments) and expected.",
          );
        activeTests = [
          ...p.cases,
          ...data.map((c, i) => ({ ...c, id: `custom-${i}` })),
        ];
      }
      setTests(submit ? p.cases : activeTests);
      const { runCode } = await import("@/lib/runners");
      const outcome = await runCode(
        language,
        {
          code,
          functionName: p.functionName,
          cases: activeTests,
          timeLimitMs: p.timeLimitMs,
          mode: p.mode,
          comparison: p.comparison,
          inputKinds: p.inputKinds,
          outputKind: p.outputKind,
          javaParams: p.javaParams,
        },
        store.settings,
        setStatus,
        controller.current.signal,
      );
      if (!mounted.current) return;
      setResult(outcome);
      setFailureInput(
        activeTests.find(
          (c) => c.id === outcome.cases.find((r) => !r.passed)?.id,
        )?.input,
      );
      if (submit) {
        const submission: Submission = {
          id: crypto.randomUUID(),
          problemId: p.id,
          language,
          code,
          verdict: outcome.verdict,
          passed: outcome.cases.filter((c) => c.passed).length,
          total: activeTests.length,
          runtimeMs: outcome.cases.reduce((s, c) => s + c.runtimeMs, 0),
          at: Date.now(),
          timeSpentMs: elapsed,
          mode: inContest ? "contest" : "practice",
          hintsUsed: hints,
          viewedEditorial: viewed,
          integrity: structuredClone(watch.getSummary()),
          results: outcome.cases,
        };
        store.addSubmission(submission);
        if (outcome.verdict === "accepted") {
          playBell(store.settings.sound);
          toast("Ding! Carriage return. That one is yours.");
          setComplexity(true);
        } else toast(`${verdictNames[outcome.verdict]} — take another look.`);
      } else
        toast(
          outcome.verdict === "accepted"
            ? "Visible cases passed. Submit to check all cases."
            : verdictNames[outcome.verdict],
        );
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error ? e.message : "Something went wrong. Try again.",
        );
    } finally {
      if (mounted.current) setRunning(false);
    }
  }
  runRef.current = execute;
  useEffect(() => {
    if (!inContest || !contest) return;
    const expired = Date.now() >= contest.endsAt;
    const tooMany =
      watch.summary.fullscreenExits >= 4 && store.settings.autoSubmit;
    if ((expired || tooMany) && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void execute(true, true).then(() =>
        store.setSession({ contest: { ...contest, finished: true } }),
      );
    }
  }, [elapsed, inContest, watch.summary.fullscreenExits]);
  function switchLanguage(l: Language) {
    storage.write(`drafts:${p.id}:${language}`, code);
    setLanguage(l);
    setCode(storage.read(`drafts:${p.id}:${l}`, p.starterCode[l]));
    store.updateSettings({ language: l });
    setResult(null);
  }
  function resize(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (event: PointerEvent) => {
      const r = bodyRef.current?.getBoundingClientRect();
      if (r)
        setSplit(
          Math.max(
            25,
            Math.min(60, ((event.clientX - r.left) / r.width) * 100),
          ),
        );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }
  const remaining =
    inContest && contest
      ? Math.max(0, contest.endsAt - Date.now())
      : store.settings.countdownMinutes
        ? Math.max(0, store.settings.countdownMinutes * 60000 - elapsed)
        : elapsed;
  const seconds = Math.floor(remaining / 1000);
  const timer = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className={`workspace ${focus ? "focus-mode" : ""}`}>
      <div className="workspace-toolbar">
        <div className="row">
          <Link
            prefetch={false}
            href="/problems/"
            className="icon-button"
            aria-label="Back to problems"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="workspace-title" aria-hidden="true">
            {p.title}
          </div>
          <span
            className="watch-pill"
            title="Watch records focus changes, pastes, and fullscreen exits. It cannot see other tabs or apps."
          >
            <Eye size={13} />
            <span className={store.profile.onboarded ? "dot" : ""} />
            {store.profile.onboarded ? "Watch on" : "Watch off"}
          </span>
        </div>
        <div className="row">
          <select
            aria-label="Editor language"
            value={language}
            disabled={running}
            onChange={(e) => switchLanguage(e.target.value as Language)}
          >
            {Object.entries(languageNames).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <span className="timer">
            <Timer size={13} />
            {timer}
          </span>
          <button
            className="icon-button hide-mobile"
            onClick={() => setFocus((v) => !v)}
            title="Focus mode"
            aria-label="Toggle focus mode"
          >
            {focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <Button
            variant="secondary"
            loading={running}
            disabled={!loaded}
            onClick={() => void execute(false)}
          >
            <Play size={12} />
            Run
          </Button>
          <Button
            disabled={running || !loaded}
            onClick={() => void execute(true)}
          >
            <Send size={12} />
            Submit
          </Button>
          {running ? (
            <button
              className="icon-button"
              aria-label="Cancel run"
              onClick={() => controller.current?.abort()}
            >
              <Square size={14} />
            </button>
          ) : null}
        </div>
      </div>
      {inContest ? (
        <div className="danger-banner">
          <span>
            STRICT WATCH · {watch.summary.fullscreenExits} / 3 fullscreen exits{" "}
            {watch.summary.fullscreenExits >= 3 ? "· Session flagged" : ""}
          </span>
          <Link prefetch={false} href="/contest/">Contest lobby →</Link>
          <Button
            variant="secondary"
            className="small"
            onClick={() => {
              void document.documentElement
                .requestFullscreen()
                .catch(() =>
                  setError(
                    "Could not enter fullscreen. Try again from the contest lobby.",
                  ),
                );
            }}
          >
            Return to fullscreen
          </Button>
        </div>
      ) : null}
      {error ? (
        <div className="danger-banner">
          <span>{error}</span>
          <button className="btn ghost small" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="workspace-mobile-tabs">
        <button
          className={`tab ${mobile === "description" ? "active" : ""}`}
          onClick={() => setMobile("description")}
        >
          Problem
        </button>
        <button
          className={`tab ${mobile === "code" ? "active" : ""}`}
          onClick={() => {
            setMobile("code");
          }}
        >
          Code & results
        </button>
        <span
          className="muted"
          style={{ fontSize: 9, marginLeft: "auto", alignSelf: "center" }}
        >
          A bigger screen gives your code room.
        </span>
      </div>
      <div
        className="workspace-body"
        data-mobile={mobile}
        ref={bodyRef}
        style={{ "--split": `${split}%` } as CSSProperties}
      >
        {showDescription ? (
          <>
            <div
              className="description-pane"
              onCopy={() => watch.log("copy_problem")}
            >
              <div className="tabs">
                {[
                  "Description",
                  "Hints",
                  "Notes",
                  "Submissions",
                  "Editorial",
                ].map((t) => (
                  <button
                    className={`tab ${tab === t ? "active" : ""}`}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tab === "Description" ? (
                description
              ) : (
                <div className="description-content">
                  {tab === "Hints" ? (
                    <>
                      <h2 style={{ marginTop: 0 }}>A nudge, not the answer.</h2>
                      <p>
                        Hints help you learn. We’ll mark them on your submission
                        so your clean solves stay honest.
                      </p>
                      {p.hints.slice(0, hints).map((h, i) => (
                        <div className="hint-item" key={h}>
                          <span className="eyebrow accent">HINT {i + 1}</span>
                          <p><Inline text={h} /></p>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        style={{ marginTop: 20 }}
                        disabled={hints >= p.hints.length}
                        onClick={() => setHints((h) => h + 1)}
                      >
                        <Lightbulb size={14} />
                        {hints >= p.hints.length
                          ? "All hints revealed"
                          : `Reveal hint ${hints + 1}`}
                      </Button>
                    </>
                  ) : tab === "Notes" ? (
                    <>
                      <h2 style={{ marginTop: 0 }}>
                        Leave a note for future you.
                      </h2>
                      <p style={{ marginBottom: 16 }}>
                        The pattern, the mistake, the moment it clicked. Plain
                        markdown is saved automatically.
                      </p>
                      <textarea
                        className="note-editor"
                        aria-label="Problem notes"
                    maxLength={20000}
                        value={store.notes[p.id] ?? ""}
                        onChange={(e) => store.setNote(p.id, e.target.value)}
                        placeholder={
                          "## Pattern\n\n## What I missed\n\n## Next time"
                        }
                      />
                    </>
                  ) : tab === "Submissions" ? (
                    <>
                      <h2 style={{ marginTop: 0 }}>Every attempt counts.</h2>
                      {pastSubmissions.length ? (
                        pastSubmissions.map((s) => (
                          <div className="hint-item" key={s.id}>
                            <Link
                              prefetch={false}
                              href={`/submissions/detail/?id=${s.id}`}
                              className={
                                s.verdict === "accepted" ? "success" : "danger"
                              }
                            >
                              {verdictNames[s.verdict]} →
                            </Link>
                            <p>
                              {s.language} · {s.passed}/{s.total} passed ·{" "}
                              {new Date(s.at).toLocaleString()}
                            </p>
                            <Button
                              variant="ghost"
                              className="small"
                              onClick={() => {
                                storage.write(
                                  `drafts:${p.id}:${language}`,
                                  code,
                                );
                                setLanguage(s.language);
                                setCode(s.code);
                                toast("Submission reopened in editor.");
                              }}
                            >
                              Re-open in editor
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p>
                          No submissions yet. Give your idea a run, then submit
                          it.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 style={{ marginTop: 0 }}>
                        Give your idea some room first.
                      </h2>
                      {!viewed ? (
                        <>
                          <p>
                            Try three submissions, or choose to view the
                            solution now. Viewing an editorial marks the attempt
                            as assisted.
                          </p>
                          <Button
                            variant="secondary"
                            style={{ marginTop: 20 }}
                            onClick={() => {
                              void loadPrivate()
                                .then(() => setViewed(true))
                                .catch((e) => setError(e.message));
                            }}
                          >
                            <Lock size={14} />
                            {pastSubmissions.length >= 3
                              ? "Unlock editorial"
                              : "Give up & view solution"}
                          </Button>
                        </>
                      ) : (
                        <pre className="prose-code">
                          {privateData?.editorialMd ??
                            "No editorial is available for this custom problem."}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div
              className="splitter"
              role="separator"
              aria-label="Resize description pane"
              aria-orientation="vertical"
              aria-valuenow={split}
              aria-valuemin={25}
              aria-valuemax={60}
              tabIndex={0}
              onPointerDown={resize}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setSplit((v) => Math.max(25, v - 2));
                if (e.key === "ArrowRight")
                  setSplit((v) => Math.min(60, v + 2));
              }}
            />
          </>
        ) : null}
        <section className="editor-pane" aria-label="Code workspace">
          <div className="editor-bar">
            <span>
              {language === "java"
                ? "Solution.java"
                : language === "python"
                  ? "solution.py"
                  : language === "typescript"
                    ? "solution.ts"
                    : "solution.js"}
            </span>
            <div className="row">
              {p.id.startsWith("custom-") ? (
                <button
                  className="icon-button"
                  title="Export custom problem"
                  aria-label="Export custom problem"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(p, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `Iwons-${p.slug}.json`;
                    anchor.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    toast("Custom problem exported.");
                  }}
                >
                  <Download size={13} />
                </button>
              ) : null}
              <button
                className="icon-button"
                title="Toggle description"
                aria-label="Toggle description pane"
                onClick={() => setShowDescription((v) => !v)}
              >
                <PanelLeft size={13} />
              </button>
              <button
                className="icon-button"
                title="Toggle results"
                aria-label="Toggle results panel"
                onClick={() => setShowResults((v) => !v)}
              >
                <PanelBottom size={13} />
              </button>
              <button
                className="icon-button"
                disabled={running}
                onClick={() => setReset(true)}
                title="Reset to starter"
                aria-label="Reset code to starter"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
          <div
            className="editor-body"
            onPasteCapture={(e) => {
              const text = e.clipboardData.getData("text");
              lastPaste.current = Date.now();
              watch.log("paste", {
                chars: text.length,
                lines: text.split("\n").length,
              });
            }}
          >
            {loaded ? (
              <CodeEditor
                language={language}
                code={code}
                onChange={setCode}
                onBurst={logTypingBurst}
              />
            ) : <EditorSkeleton />}
          </div>
          <div className="editor-bottom">
            <span>
              UTF-8 · {languageNames[language]} · {store.settings.tabSize}{" "}
              spaces
            </span>
            <span>
              {loaded ? "Draft autosaves locally" : "Loading draft…"} · ⌘/Ctrl ↵
              to run
            </span>
          </div>
          {showResults ? (
            <ResultsPanel
              failureInput={failureInput}
              result={result}
              tests={tests}
              running={running}
              status={status}
              custom={custom}
              onCustom={setCustom}
            />
          ) : null}
        </section>
      </div>
      <Modal
        open={reset}
        onClose={() => setReset(false)}
        title="Start with a clean slate?"
      >
        <p>
          This replaces your {languageNames[language]} draft with the starter.
          Your past submissions stay saved.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReset(false)}>
            Keep draft
          </Button>
          <Button
            onClick={() => {
              setCode(p.starterCode[language]);
              setReset(false);
              toast("Starter restored.");
            }}
          >
            Reset to starter
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!watch.away}
        onClose={() => watch.report()}
        title="Welcome back."
      >
        <p>
          You were away for {Math.round((watch.away?.durationMs ?? 0) / 1000)}{" "}
          seconds. What did you do? This is optional and saved as self-reported.
        </p>
        <div className="option-row">
          {[
            ["docs", "Looked up docs"],
            ["other_browser", "Other browser"],
            ["phone", "Phone"],
            ["break", "Break"],
            ["other", "Other"],
          ].map(([value, label]) => (
            <Button
              variant="secondary"
              key={value}
              onClick={() =>
                watch.report(
                  value as
                    | "docs"
                    | "other_browser"
                    | "phone"
                    | "break"
                    | "other",
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => watch.report()}>
            Skip
          </Button>
        </div>
      </Modal>
      <Modal
        open={complexity}
        onClose={() => setComplexity(false)}
        title="Accepted — how your solution scales"
      >
        <ComplexityPanel time={p.complexity.time} space={p.complexity.space} />
        <div className="modal-actions">
          <Button onClick={() => setComplexity(false)}>Keep practicing</Button>
        </div>
      </Modal>
      <Onboarding open={onboard} onClose={() => setOnboard(false)} />
    </div>
  );
}
