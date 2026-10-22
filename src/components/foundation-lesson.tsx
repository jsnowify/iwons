"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { runCode } from "@/lib/runners";
import { foundationFeedback, type FoundationTopic, type FoundationStep } from "@/lib/topic-foundations";
import { Button, EditorSkeleton, ProgressBar } from "./ui";

const CodeEditor = dynamic(() => import("./code-editor"), { ssr: false, loading: () => <EditorSkeleton /> });

export function FoundationLesson({ topic }: { topic: FoundationTopic }) {
  const progress = useStore(s => s.topicFoundations[topic.id]);
  const firstPending = topic.foundation.steps.findIndex(s => !progress?.steps[s.id]?.completed);
  const [index, setIndex] = useState(firstPending < 0 ? 0 : firstPending);
  const steps = topic.foundation.steps;
  return <article className="primer foundation-lesson" aria-label={`${topic.title} foundation lesson`}>
    <header className="foundation-header">
    <h3>Foundation Lesson {progress?.completed ? "— Complete ✓" : ""}</h3>
    <p>Step {index + 1} of {steps.length} · JavaScript · Take your time.</p>
    <ProgressBar value={steps.filter(s => progress?.steps[s.id]?.completed).length / steps.length * 100} label={`${topic.title} foundation progress`} />
    </header>
    <FoundationStepView key={steps[index].id} topic={topic} step={steps[index]} />
    <div className="row foundation-actions foundation-navigation">
      <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>Previous step</Button>
      {index < steps.length - 1 ? <Button disabled={!progress?.steps[steps[index].id]?.completed} onClick={() => setIndex(i => i + 1)}>Next step</Button> : null}
    </div>
    {progress?.completed ? <p role="status" className="success">You worked through the foundation. Your topic challenges are ready below.</p> : null}
  </article>;
}

function FoundationStepView({ topic, step }: { topic: FoundationTopic; step: FoundationStep }) {
  const saved = useStore(s => s.topicFoundations[topic.id]?.steps[step.id]);
  const settings = useStore(s => s.settings);
  const save = useStore(s => s.saveFoundationStep);
  const [code, setCode] = useState(saved?.code ?? step.starterCode);
  const [hints, setHints] = useState(saved?.hintsUsed ?? 0);
  const [feedback, setFeedback] = useState("");
  const [recall, setRecall] = useState("");
  const [running, setRunning] = useState(false);
  const [showExample, setShowExample] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; controller.current?.abort(); };
  }, []);
  function persist(nextCode = code, nextHints = hints, completed = saved?.completed ?? false, attempts = saved?.attempts ?? 0) {
    save(topic.id, step.id, { code: nextCode, hintsUsed: nextHints, completed, attempts }, topic.foundation.steps.map(s => s.id));
  }
  async function run() {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(true);
    persist(code, hints, saved?.completed, (saved?.attempts ?? 0) + 1);
    try {
      const result = await runCode("javascript", {
        code, functionName: step.functionName, cases: step.validate,
        mode: "function", timeLimitMs: 2000, inputKinds: step.inputKinds,
      }, settings, () => {}, abort.signal);
      if (!active.current) return;
      const recalled = !step.recall || recall.trim().toLowerCase() === step.recall.answer.toLowerCase();
      const passed = result.verdict === "accepted" && recalled;
      setFeedback(result.verdict === "accepted" && !recalled
        ? "Your code works. Try the recall question too; think back to the earlier step."
        : foundationFeedback(result, step));
      persist(code, hints, passed || saved?.completed, (saved?.attempts ?? 0) + 1);
    } catch {
      if (active.current) setFeedback("The runner could not start. Please run your code again.");
    } finally {
      controller.current = null;
      if (active.current) setRunning(false);
    }
  }
  return <div className="primer-body foundation-step">
    <div className="foundation-explanation">
    <h4>{step.title} {saved?.completed ? "✓" : ""}</h4>
    <p>{step.explanation}</p>
    </div>
    <div className="foundation-example">
    <Button variant="secondary" onClick={() => setShowExample(v => !v)}>{showExample ? "Hide example" : "Peek at example"}</Button>
    {showExample ? <pre className="code-view" style={{ maxWidth: "100%", overflowX: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}><code>{step.exampleCode}</code></pre> : null}
    </div>
    {step.referenceCode ? <details>
      <summary>Reference for the later challenge receipts</summary>
      <p>Each card asks for one of these list operations. The first card returns the list unchanged; later cards use a total, a count, a first match, a largest or smallest value, or position weights. You can revisit this reference whenever you need it.</p>
      <pre className="code-view" style={{ maxWidth: "100%", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}><code>{step.referenceCode}</code></pre>
    </details> : null}
    <p><strong>Your turn:</strong> {step.task}</p>
    <div className="foundation-editor">
      <CodeEditor code={code} readOnly={running} language="javascript" onBurst={() => {}} onChange={value => { setCode(value); persist(value); }} />
    </div>
    <p>Checks: {step.validate.map(c => `${JSON.stringify(c.input)} → ${JSON.stringify(c.expected)}`).join("; ")}</p>
    {step.recall ? <label className="foundation-recall">{step.recall.prompt}<input aria-label="Recall answer" value={recall} disabled={running} onChange={e => setRecall(e.target.value)} /></label> : null}
    <div className="row foundation-actions">
      <Button loading={running} onClick={run}>Run and check</Button>
      <Button variant="secondary" disabled={running} onClick={() => { setCode(step.starterCode); setFeedback(""); persist(step.starterCode); }}>Reset to starter</Button>
      <Button variant="secondary" disabled={running || hints === 3} onClick={() => { const next = hints + 1; setHints(next); persist(code, next); }}>Hint {Math.min(3, hints + 1)} of 3</Button>
    </div>
    {hints > 0 ? <div className="screen-note" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{step.hints[hints - 1]}</div> : null}
    <p role="status" aria-live="polite" className="foundation-feedback">{feedback}</p>
  </div>;
}
