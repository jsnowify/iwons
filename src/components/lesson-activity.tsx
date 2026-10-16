"use client";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { runCode } from "@/lib/runners";
import { translated } from "@/lib/foundations/translations";
import { matchesRecall, type EngineLesson, type LessonKeys } from "@/lib/foundations/lesson-engine";
import { rateRecall, recallKey } from "@/lib/foundations/learning-state";
import type { Track } from "@/lib/foundations/model-v2";
import type { RunResult } from "@/lib/types";
import { LearningExerciseLink } from "./learn-controls";
import { RecallCard } from "./recall-card";

const stages = ["Predict", "Run", "Investigate", "Modify", "Make", "Recall", "Recap"];
export function LessonActivity({ lesson, track, moduleHref, preview = false, sessionStep=false, onStepDone }: { lesson: EngineLesson; track: Track; moduleHref: string; preview?: boolean;sessionStep?:boolean;onStepDone?:()=>void }) {
  const visibleStages=sessionStep?stages.slice(0,2):stages;
  const language = useStore(state => state.settings.lessonLanguage);
  const settings = useStore(state => state.settings);
  const savedExplanation = useStore(state => state.learning.explanations[`${lesson.id}:${track}`] ?? "");
  const part = lesson.tracks[track]!;
  const copy = translated(lesson.shared, language);
  const [stage, setStage] = useState(0), [guess, setGuess] = useState("");
  const [traceIndex, setTraceIndex] = useState(0), [traceGuess, setTraceGuess] = useState("");
  const [traceFeedback, setTraceFeedback] = useState("");
  const [code, setCode] = useState(part.code), [busy, setBusy] = useState(false), [status, setStatus] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [explained, setExplained] = useState("");
  const [finished, setFinished] = useState(false);
  const [draftLoaded,setDraftLoaded]=useState(false);
  const draft=useRef({guess,code,traceGuess});draft.current={guess,code,traceGuess};
  useEffect(()=>{if(!preview){try{const value:unknown=JSON.parse(storage.read(`drafts:lesson-${lesson.id}:${track}`,""));if(value&&typeof value==="object"){const saved=value as Record<string,unknown>;if(typeof saved.guess==="string")setGuess(saved.guess);if(typeof saved.code==="string")setCode(saved.code);if(typeof saved.traceGuess==="string")setTraceGuess(saved.traceGuess);}}catch{/* A new lesson has no draft. */}}setDraftLoaded(true);const flush=()=>{if(!preview)storage.write(`drafts:lesson-${lesson.id}:${track}`,JSON.stringify(draft.current));};window.addEventListener("pagehide",flush);return()=>{window.removeEventListener("pagehide",flush);flush();};},[lesson.id,track,preview]);
  useEffect(()=>{if(!draftLoaded||preview)return;const timer=setTimeout(()=>storage.write(`drafts:lesson-${lesson.id}:${track}`,JSON.stringify({guess,code,traceGuess})),500);return()=>clearTimeout(timer);},[draftLoaded,preview,lesson.id,track,guess,code,traceGuess]);
  const attemptStartedAt=useRef<number|null>(null);
  const startedAt = useRef<number | null>(null);
  const keys = useRef<LessonKeys | null>(null);
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { startedAt.current = Date.now(); attemptStartedAt.current=startedAt.current; return () => controller.current?.abort(); }, []);
  async function getKeys() {
    if (!keys.current) {
      const response = await fetch(`/learn-data/${encodeURIComponent(lesson.id)}.json`);
      if (!response.ok) throw new Error("Could not load lesson checks.");
      const value = await response.json() as LessonKeys;
      if (value.lessonId !== lesson.id || !value.tracks[track]) throw new Error("Lesson checks do not match.");
      keys.current = value;
    }
    return keys.current.tracks[track]!;
  }
  function changeStage(index: number) {
    controller.current?.abort(); setBusy(false); setStage(index); setStatus(""); setRunResult(null);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function execute(modify: boolean) {
    if (busy || (modify && !confidence)) return;
    setBusy(true); setRunResult(null); controller.current = new AbortController(); const signal = controller.current.signal;
    try {
      const privatePart = await getKeys(); if (signal.aborted) return;
      const cases = modify ? privatePart.modify.cases : [{ id: "example", stdin: part.stdin, expected: privatePart.expectedOutput }];
      const result = await runCode(track, { code: modify ? code : part.code, functionName: "main", mode: "program", cases: cases.map(item => ({ ...item, input: [] })), timeLimitMs: 5000, strictTypes: track === "typescript", action: modify ? "submit" : "run" }, settings, setStatus, signal);
      if (signal.aborted) return;
      setRunResult(result);
      const correct = result.verdict === "accepted";
      if (modify) {
        const store = useStore.getState(); const now = Date.now();
        if (!preview) store.setLearning({ ...store.learning, attempts: [...store.learning.attempts, { exerciseId: `${lesson.id}-modify`, course: lesson.course, track, concept: lesson.concepts[0], rung: "completion", at: now, correct, clean: correct, hints: 0, confidence: confidence!, durationMs: Math.max(0, now - (attemptStartedAt.current ?? now)) }] });
        attemptStartedAt.current=now;
        setStatus(correct ? "Your change passes the checks. Explain one choice below, or continue to Make." : "Not yet. Compare the expected and actual output below, then edit the program and check again.");
      } else {
        const predicted = matchesRecall(guess, privatePart.predict);
        setStatus(`${predicted ? "Prediction matched." : "Not yet."} ${privatePart.predict.reason} ${predicted ? "Continue to Investigate." : privatePart.predict.nextStep}`);
      }
    } catch { if (!signal.aborted) setStatus("The lesson checks could not load. Your draft is still here; try the check again."); }
    finally { if (!signal.aborted) setBusy(false); }
  }
  function finish() {
    if (finished) return;
    if (preview) { setFinished(true); return; }
    const store = useStore.getState(); const now = Date.now();
    store.setFoundationsProgress({ ...store.foundations, [track]: { ...store.foundations[track], lessonsRead: { ...store.foundations[track].lessonsRead, [lesson.id]: true } } });
    const recalls = { ...store.learning.recalls };
    for (const card of part.recallCards) {
      const key = recallKey(lesson.course, track, card.concept, card.id);
      recalls[key] ??= { cardId: card.id, course: lesson.course, track, concept: card.concept, step: 0, due: now + 86400000, successes: 0, misses: 0 };
    }
    store.setLearning({ ...store.learning, recalls, sessions: [...store.learning.sessions, { id: `${lesson.id}:${track}:${now}`, track, startedAt: startedAt.current ?? now, endedAt: now, recalled: store.learning.recallLog.filter(item => item.at >= (startedAt.current ?? now)).map(item => item.key), revisit: store.learning.recallLog.filter(item => item.at >= (startedAt.current ?? now) && !item.correct).map(item => item.key), completed: [lesson.id] }] });
    setFinished(true);
  }
  const unavailable = track === "java" && !settings.judgeUrl.trim();
  const trace = translated(part.trace, language).content;
  return <>
    {copy.missing ? <p role="status">Not translated yet. This lesson uses English; your language preference is saved.</p> : null}
    <nav className="learning-ribbon" aria-label="Lesson steps">{visibleStages.map((name, index) => <button type="button" key={name} aria-current={stage === index ? "step" : undefined} onClick={() => changeStage(index)}>{index + 1}. {name}</button>)}</nav>
    <section className="learning-step" aria-labelledby="lesson-stage-heading">
      <p>Step {stage + 1} of {visibleStages.length}</p><h2 id="lesson-stage-heading" tabIndex={-1} ref={heading}>{stages[stage]}</h2>
      {stage === 0 ? <><p>{translated(part.predict, language).content.prompt}</p><pre>{part.code}</pre><label>Your guess slip<textarea rows={3} value={guess} onChange={event => setGuess(event.target.value)} spellCheck={false}/></label><p>{copy.content.story}</p>{unavailable?<><label>Try a first edit on your computer<textarea rows={6} value={code} onChange={event=>setCode(event.target.value)} spellCheck={false}/></label><p>Save this as Main.java. With JDK 9 or later, run javac --release 8 Main.java, then java Main. With JDK 8, use javac Main.java, then java Main.</p></>:null}<button className="btn" onClick={() => changeStage(1)}>Keep my guess and try it</button></> : null}
      {stage === 1 ? <><pre>{part.code}</pre><p>Input: {part.stdin || "No input for this example."}</p><button className="btn" disabled={busy || unavailable} onClick={() => void execute(false)}>{busy ? "Running…" : "Try it"}</button><p>{copy.content.idea}</p></> : null}
      {stage === 2 ? <><p>{trace.steps[traceIndex]?.message}</p><pre>Line {trace.steps[traceIndex]?.line}{"\n"}{trace.steps[traceIndex]?.state}</pre><div className="learning-actions"><button className="btn secondary" disabled={traceIndex === 0} onClick={() => setTraceIndex(index => index - 1)}>Previous trace step</button><button className="btn secondary" disabled={traceIndex === trace.steps.length - 1} onClick={() => setTraceIndex(index => index + 1)}>Next trace step</button></div><label>{trace.question}<input value={traceGuess} onChange={event => setTraceGuess(event.target.value)}/></label><button className="btn secondary" onClick={async () => { try { const key = (await getKeys()).trace; setTraceFeedback(`${matchesRecall(traceGuess, key) ? "Matched." : "Not yet."} ${key.reason} ${key.nextStep}`); } catch { setTraceFeedback("The trace check could not load. Keep your answer and try Check trace again."); } }}>Check trace</button><p role="status">{traceFeedback}</p>{part.annotations?<><h3>Read the lines</h3><ul>{translated(part.annotations,language).content.items.map(item=><li key={item.line}>Line {item.line}: {item.text}</li>)}</ul></>:null}<h3>Common mistakes</h3><ul>{translated(part.commonMistakes, language).content.items.map(item => <li key={item}>{item}</li>)}</ul>{part.notes?<details><summary>Language notes</summary><ul>{translated(part.notes,language).content.items.map(item=><li key={item}>{item}</li>)}</ul></details>:null}</> : null}
      {stage === 3 ? <><p>{translated(part.modify, language).content.prompt}</p><label>Your program<textarea rows={10} spellCheck={false} value={code} onChange={event => setCode(event.target.value)}/></label><fieldset><legend>How confident are you before checking?</legend><div className="learning-actions">{([1, 2, 3] as const).map(value => <button className="btn secondary" type="button" key={value} aria-pressed={confidence === value} onClick={() => setConfidence(value)}>{["Not sure", "Somewhat sure", "Very sure"][value - 1]}</button>)}</div></fieldset><button className="btn" disabled={busy || !confidence || unavailable} onClick={() => void execute(true)}>Check my change</button>{runResult?.verdict === "accepted" ? <label>Explain to Tik (optional)<textarea rows={3} value={preview ? explained : savedExplanation} onChange={event => { setExplained(event.target.value); const store = useStore.getState(); if (!preview) store.setLearning({ ...store.learning, explanations: { ...store.learning.explanations, [`${lesson.id}:${track}`]: event.target.value } }); }}/></label> : null}<details><summary>Try to break it (optional)</summary><p>{translated(part.breakIt, language).content.prompt}</p><p>Use your program above. Read the first error line, then undo the change and check again.</p></details></> : null}
      {stage === 4 ? <><p>{copy.content.make}</p>{preview ? <p>This tool demonstration has no course exercises.</p> : <ul>{part.ladder.map(item => <li key={`${item.exerciseId}:${item.rung}`}><LearningExerciseLink track={track} slug={item.slug??item.exerciseId}>{item.title ?? ({worked:"Worked example",completion:"Complete the program",parsons:"Arrange the program",fix:"Fix the program",write:"Write your own program"}[item.rung])}</LearningExerciseLink></li>)}</ul>}</> : null}
      {stage === 5 ? <><p>Try recalling before revealing. A miss is useful information: trace the example and give it another try.</p>{part.recallCards.map(card => <RecallCard key={card.id} card={card} preview={preview} getAnswer={async () => (await getKeys()).recall[card.id]} onRate={(correct, rating) => { if (preview) return; const store = useStore.getState(); const now = Date.now(); const key = recallKey(lesson.course, track, card.concept, card.id); const previous = store.learning.recalls[key] ?? { cardId: card.id, course: lesson.course, track, concept: card.concept, step: 0, due: now, successes: 0, misses: 0 }; store.setLearning({ ...store.learning, recalls: { ...store.learning.recalls, [key]: rateRecall(previous, rating, correct, now) }, recallLog: [...store.learning.recallLog, { key, at: now, correct, rating: correct ? rating : "Again" }] }); }}/>)}</> : null}
      {stage === 6 ? <div className="learning-session-summary"><p>{copy.content.recap}</p><button className="btn" onClick={finish} disabled={finished}>{finished ? "Lesson recorded" : "Finish lesson"}</button>{finished ? <p role="status">{preview ? "Preview complete. No learning records were changed." : "Your lesson and recall schedule are saved on this device. Return to the module to choose your next step."}</p> : null}<p><Link href={moduleHref}>Return to the module</Link></p></div> : null}
      {unavailable && (stage === 1 || stage === 3) ? <p>Run on your computer or set a Java backend in Settings. This program is not runnable in this browser until an endpoint is configured.</p> : null}
      {sessionStep&&stage===1?<button className="btn" disabled={busy||(!unavailable&&runResult?.verdict!=="accepted")} onClick={onStepDone}>{unavailable?"Continue after trying locally":"Continue to the exercise"}</button>:null}
      <p role="status">{status}</p>
      {runResult?.compileError ? <><p>The program needs a change. Start with the first reported line below.</p><pre>{runResult.compileError.message}</pre></> : null}
      {runResult?.diagnostics?.map((diagnostic, index) => <p key={index}>TypeScript line {diagnostic.line}: {diagnostic.message}</p>)}
      {runResult?.cases.map(test => <div key={test.id}><p>{test.passed ? "Passed" : "Not yet"}: {test.id}</p><pre>Expected: {String(test.expected)}{"\n"}Actual: {String(test.actual)}{test.error ? `\n${test.error}` : ""}</pre></div>)}
      <div className="learning-actions">{stage > 0 ? <button className="btn secondary" onClick={() => changeStage(stage - 1)}>Previous step</button> : null}{stage < visibleStages.length - 1 ? <button className="btn secondary" onClick={() => changeStage(stage + 1)}>Next step</button> : null}</div>
    </section>
  </>;
}
