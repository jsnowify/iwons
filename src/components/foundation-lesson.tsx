"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { storage } from "@/lib/storage";
import { runCode } from "@/lib/runners";
import { FOUNDATION_TRACK_ID, exampleOutputFor, foundationLanguages, foundationLessonIds, lessonCases, lessonDone, lessonFeedback, readFoundationPractice, stepKey,
  type CodeLessonCopy, type CodePractice, type FoundationCase, type ConceptLessonCopy, type ConceptPractice, type FoundationLanguage,
  type FoundationLessonCopy, type FoundationPractice } from "@/lib/foundation-track";
import { useAccount } from "./account-provider";
import { Button, EditorSkeleton } from "./ui";

const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <EditorSkeleton /> });
const labelOf = (language: FoundationLanguage) => foundationLanguages.find(item => item.id === language)!.label;

function Output({ label, value, block = false }: { label: string; value: string; block?: boolean }) {
  return block || value.includes("\n") ? <div><p>{label}:</p><pre className="code-view">{value}</pre></div> : <p>{label}: <code>{value}</code></p>;
}
function ExpectedCases({ cases }: { cases: FoundationCase[] }) {
  if (cases.length === 1 && !cases[0].stdin) return <Output label="Expected output" value={cases[0].expected} />;
  return <div className="foundation-cases">
    <p>Your program is checked with {cases.length === 1 ? "this input" : `these ${cases.length} inputs`}:</p>
    {cases.map((item, index) => <div key={index} className="foundation-case">
      {item.stdin ? <Output label="Input" value={item.stdin.trimEnd()} block /> : null}
      <Output label="Expected output" value={item.expected} block={!!item.stdin} />
    </div>)}
  </div>;
}

function LanguageSwitch({ language, onChange }: { language: FoundationLanguage; onChange: (language: FoundationLanguage) => void }) {
  return <div className="row foundation-languages" role="group" aria-label="Language">
    {foundationLanguages.map(item => <Button key={item.id} variant="secondary" aria-pressed={language === item.id}
      onClick={() => onChange(item.id)}>{item.label}</Button>)}
  </div>;
}

/** Loads the lazy practice file (answers, hints, concept checks) and keeps it out of the initial HTML. */
function usePractice(lessonId: string) {
  const [practice, setPractice] = useState<FoundationPractice | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setError("");
      try {
        const response = await fetch(`/foundation-lessons/${lessonId}.json`, { signal: controller.signal });
        if (!response.ok) throw new Error("Lesson practice unavailable.");
        const data = readFoundationPractice(await response.json(), lessonId);
        if (!controller.signal.aborted) setPractice(data);
      } catch {
        if (!controller.signal.aborted) setError("The practice could not load. Your saved work is safe; retry or visit another lesson.");
      }
    }
    void load();
    return () => controller.abort();
  }, [lessonId, retry]);
  return { practice, error, retry: () => setRetry(value => value + 1) };
}

export function FoundationLessonBody({ lesson }: { lesson: FoundationLessonCopy }) {
  const [language, setLanguage] = useState<FoundationLanguage>("javascript");
  useEffect(() => { const saved = storage.foundationLanguage(); if (saved) setLanguage(saved); }, []);
  const choose = (next: FoundationLanguage) => { setLanguage(next); storage.foundationLanguage(next); };
  return lesson.type === "concept" ? <ConceptLesson lesson={lesson} language={language} onLanguage={choose} />
    : <CodeLesson lesson={lesson} language={language} onLanguage={choose} />;
}

function CodeLesson({ lesson, language, onLanguage }: { lesson: CodeLessonCopy; language: FoundationLanguage; onLanguage: (language: FoundationLanguage) => void }) {
  const hydrated = useStore(state => state.hydrated);
  const { ready, progressVersion } = useAccount();
  const { practice, error, retry } = usePractice(lesson.id);
  const [visible, setVisible] = useState(true);
  return <>
    <section className="foundation-example" aria-label="Worked example">
      <h2>Worked example</h2>
      <LanguageSwitch language={language} onChange={onLanguage} />
      <Button variant="secondary" aria-expanded={visible} onClick={() => setVisible(value => !value)}>{visible ? "Hide example" : "Peek at example"}</Button>
      {foundationLanguages.map(item => <div key={item.id} hidden={!visible || language !== item.id} className="foundation-example-body">
        <p className="muted">{lesson.languages[item.id].note}</p>
        <pre className="code-view"><code>{lesson.languages[item.id].exampleCode}</code></pre>
        {lesson.exampleInput ? <Output label="Input" value={lesson.exampleInput.trimEnd()} block /> : null}
        <Output label="Output" value={exampleOutputFor(lesson, item.id)} />
      </div>)}
    </section>
    <section className="foundation-step" aria-label="Lesson practice">
      <h2>Your turn</h2>
      <p>{lesson.task}</p>
      <ExpectedCases cases={lessonCases(lesson, language)} />
      {error ? <><p role="alert">{error}</p><Button variant="secondary" onClick={retry}>Retry practice</Button></> :
        practice?.type === "code" && hydrated && ready
          ? <LessonEditor key={`${lesson.id}:${language}:${progressVersion}`} lesson={lesson} practice={practice} language={language} />
          : <><p role="status">Loading your practice…</p><EditorSkeleton /></>}
    </section>
  </>;
}

function LessonEditor({ lesson, practice, language }: { lesson: CodeLessonCopy; practice: CodePractice; language: FoundationLanguage }) {
  const key = stepKey(lesson.id, language);
  const content = practice.languages[language];
  const cases = lessonCases(lesson, language);
  const saved = useStore(state => state.topicFoundations[FOUNDATION_TRACK_ID]?.steps[key]);
  const finished = useStore(state => lessonDone(state.topicFoundations[FOUNDATION_TRACK_ID]?.steps, lesson.id));
  const save = useStore(state => state.saveFoundationStep);
  const settings = useStore(state => state.settings);
  const [code, setCode] = useState(saved?.code ?? content.starterCode);
  const [hint, setHint] = useState(saved?.hintsUsed ?? 0);
  const [feedback, setFeedback] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    if (!useStore.getState().topicFoundations[FOUNDATION_TRACK_ID]?.steps[key])
      save(FOUNDATION_TRACK_ID, key, { code: content.starterCode, hintsUsed: 0, completed: false, attempts: 0 }, foundationLessonIds);
    return () => { mounted.current = false; controller.current?.abort(); };
  }, [key, content.starterCode, save]);

  function persist(nextCode: string, hintsUsed = hint, completed = false, attempt = false) {
    const steps = () => useStore.getState().topicFoundations[FOUNDATION_TRACK_ID]?.steps;
    const previous = steps()?.[key];
    save(FOUNDATION_TRACK_ID, key, {
      code: nextCode, completed: completed || previous?.completed || false,
      hintsUsed: Math.max(hintsUsed, previous?.hintsUsed ?? 0), attempts: (previous?.attempts ?? 0) + Number(attempt),
    }, foundationLessonIds);
    // Finishing in any language completes the lesson itself, which is what the overview reads.
    const record = steps()?.[lesson.id];
    if (completed && key !== lesson.id && !record?.completed)
      save(FOUNDATION_TRACK_ID, lesson.id, { code: record?.code ?? practice.languages.javascript.starterCode, hintsUsed: record?.hintsUsed ?? 0,
        completed: true, attempts: record?.attempts ?? 0 }, foundationLessonIds);
  }
  async function run() {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(true); setFeedback(""); setOutput(null); setStatus("");
    persist(code, hint, false, true);
    try {
      const result = await runCode(language, { code, functionName: "", mode: "program", timeLimitMs: 2000,
        cases: cases.map((item, index) => ({ id: `case-${index}`, input: [], stdin: item.stdin, expected: item.expected })) }, settings, message => { if (mounted.current) setStatus(message); }, abort.signal);
      if (!mounted.current) return;
      setFeedback(lessonFeedback(result, lesson, language, cases));
      setOutput(result.cases.find(item => !item.passed)?.stdout ?? result.cases[0]?.stdout ?? "");
      persist(code, hint, result.verdict === "accepted");
    } catch {
      if (mounted.current) setFeedback("The runner could not start. Your code is saved; try Run and check again.");
    } finally {
      controller.current = null;
      if (mounted.current) { setRunning(false); setStatus(""); }
    }
  }
  return <>
    {finished ? <p className="success">Done. You can keep experimenting or visit any other lesson.</p> : null}
    <div className="foundation-editor">
      <CodeEditor code={code} readOnly={running} language={language} onBurst={() => {}} onChange={value => { if (running) return; setCode(value); persist(value); setFeedback(""); setOutput(null); }} />
    </div>
    <div className="row foundation-actions">
      <Button loading={running} onClick={run}>Run and check</Button>
      <Button variant="secondary" disabled={running} onClick={() => { setCode(content.starterCode); setFeedback(""); setOutput(null); persist(content.starterCode); }}>Reset to starter</Button>
    </div>
    <p className="muted foundation-status" role="status" aria-live="polite">{running ? status : ""}</p>
    {output !== null && output !== "" ? <div><h3>Your output</h3><pre className="code-view">{output}</pre></div> : null}
    <p role="status" aria-live="polite" className="foundation-feedback">{feedback}</p>
    <section className="foundation-hints" aria-label="Optional hints">
      <h3>A little help, if you want it</h3>
      <p>Use any hint, or skip them all. There is no penalty.</p>
      <div className="row foundation-actions">
        {["1. Nudge", "2. More specific", "3. Reveal solution"].map((label, index) => <Button key={label} variant="secondary" aria-pressed={hint === index + 1}
          onClick={() => { setHint(index + 1); persist(code, index + 1); }}>{label}</Button>)}
      </div>
      {hint > 0 ? <div className="screen-note foundation-hint" aria-live="polite"><p>{content.hints[hint - 1]}</p>
        {hint === 3 ? <pre className="code-view"><code>{content.answerCode}</code></pre> : null}</div> : null}
    </section>
  </>;
}

function ConceptLesson({ lesson, language, onLanguage }: { lesson: ConceptLessonCopy; language: FoundationLanguage; onLanguage: (language: FoundationLanguage) => void }) {
  const hydrated = useStore(state => state.hydrated);
  const { ready, progressVersion } = useAccount();
  const { practice, error, retry } = usePractice(lesson.id);
  const snippets = lesson.snippets ? foundationLanguages.filter(item => lesson.snippets?.[item.id]) : [];
  return <>
    <figure className="foundation-illustration">
      <h2>Picture it</h2>
      <pre className="code-view" aria-hidden="true">{lesson.illustration}</pre>
      <figcaption>{lesson.illustrationCaption}</figcaption>
    </figure>
    {snippets.length ? <section className="foundation-example" aria-label="Read-only code example">
      <h2>Code example</h2>
      {snippets.length > 1 ? <LanguageSwitch language={language} onChange={onLanguage} /> : null}
      {snippets.map(item => <div key={item.id} hidden={(snippets.some(entry => entry.id === language) ? language : snippets[0].id) !== item.id} className="foundation-example-body">
        <pre className="code-view" tabIndex={0} aria-label={`${labelOf(item.id)} example, read only`}><code>{lesson.snippets![item.id]!.code}</code></pre>
        <Output label="Output" value={lesson.snippets![item.id]!.output} />
        {lesson.snippets![item.id]!.caption ? <p className="muted">{lesson.snippets![item.id]!.caption}</p> : null}
      </div>)}
    </section> : null}
    <section className="foundation-step" aria-label="Lesson practice">
      <h2>Check yourself</h2>
      <p>Pick an answer for each question. You can retry as many times as you like.</p>
      {error ? <><p role="alert">{error}</p><Button variant="secondary" onClick={retry}>Retry questions</Button></> :
        practice?.type === "concept" && hydrated && ready
          ? <ConceptCheck key={`${lesson.id}:${progressVersion}`} lesson={lesson} practice={practice} />
          : <p role="status">Loading the questions…</p>}
    </section>
  </>;
}

function readSolved(code: string | undefined, count: number) {
  try {
    const value = (JSON.parse(code ?? "") as { solved?: unknown }).solved;
    return Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < count) : [];
  } catch { return []; }
}

function ConceptCheck({ lesson, practice }: { lesson: ConceptLessonCopy; practice: ConceptPractice }) {
  const saved = useStore(state => state.topicFoundations[FOUNDATION_TRACK_ID]?.steps[lesson.id]);
  const save = useStore(state => state.saveFoundationStep);
  const [solved, setSolved] = useState<number[]>(() => readSolved(saved?.code, practice.check.length));
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [misses, setMisses] = useState<Record<number, number>>({});
  const [message, setMessage] = useState<Record<number, string>>({});
  const total = practice.check.length;
  const complete = solved.length === total;

  function persist(nextSolved: number[]) {
    const previous = useStore.getState().topicFoundations[FOUNDATION_TRACK_ID]?.steps[lesson.id];
    save(FOUNDATION_TRACK_ID, lesson.id, { code: JSON.stringify({ solved: nextSolved }), hintsUsed: 0, attempts: (previous?.attempts ?? 0) + 1,
      completed: previous?.completed || nextSolved.length === total }, foundationLessonIds);
  }
  function check(index: number) {
    const question = practice.check[index];
    if (picked[index] === undefined) return;
    if (picked[index] === question.answer) {
      const next = [...new Set([...solved, index])];
      setSolved(next); setMessage(current => ({ ...current, [index]: `Right! ${question.explanation}` })); persist(next);
    } else {
      const count = (misses[index] ?? 0) + 1;
      setMisses(current => ({ ...current, [index]: count }));
      setMessage(current => ({ ...current, [index]: `Not quite yet. ${question.hint}${count >= 2 ? ` Here is why the right answer works: ${question.explanation}` : ""}` }));
      persist(solved);
    }
  }
  return <div className="stack concept-check">
    {practice.check.map((question, index) => {
      const done = solved.includes(index);
      return <fieldset key={question.prompt} className="concept-question">
        <legend>{index + 1}. {question.prompt}</legend>
        {question.options.map((option, choice) => <label key={option} className="check-row">
          <input type="radio" name={`${lesson.id}-q${index}`} checked={done ? choice === question.answer : picked[index] === choice} disabled={done}
            onChange={() => { setPicked(current => ({ ...current, [index]: choice })); setMessage(current => ({ ...current, [index]: "" })); }} />
          <span>{option}</span>
        </label>)}
        <div className="row foundation-actions">
          <Button variant="secondary" disabled={done || picked[index] === undefined} onClick={() => check(index)}>{done ? "Answered" : "Check answer"}</Button>
        </div>
        <p role="status" aria-live="polite" className={`concept-feedback ${done ? "success" : ""}`}>{message[index] ?? (done ? question.explanation : "")}</p>
      </fieldset>;
    })}
    {complete ? <p className="success" role="status">{lesson.successMessage}</p> : null}
    {solved.length ? <div><Button variant="ghost" className="small" onClick={() => { setSolved([]); setPicked({}); setMisses({}); setMessage({}); persist([]); }}>Answer the questions again</Button></div> : null}
  </div>;
}
