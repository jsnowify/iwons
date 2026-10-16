"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/store/use-store";
import { storage } from "@/lib/storage";
import { tracks, trackNames, type Track, type MultiTrackExercise, type MultiTrackExercisePrivate } from "@/lib/foundations/model-v2";
import { translated } from "@/lib/foundations/translations";
import { suggestedRung } from "@/lib/foundations/learning-state";
import { ResultsPanel } from "./results-panel";
import { EditorSkeleton } from "./ui";
import { HumanLanguagePicker } from "./learn-controls";
import { Parsons } from "./parsons";
import type { RunResult, TestCase } from "@/lib/types";

const CodeEditor=dynamic(()=>import("./code-editor"),{ssr:false,loading:()=> <EditorSkeleton/>});
export function LearningWorkspace({exercise,description,moduleHref,nextHref,preview=false,onAccepted,explicitTrack,onTrackChange,embedded=false,courseTitle}:{exercise:MultiTrackExercise;description:ReactNode;moduleHref:string;nextHref?:string;preview?:boolean;onAccepted?:()=>void;explicitTrack?:Track;onTrackChange?:(track:Track)=>void;embedded?:boolean;courseTitle?:string}){
 const preferred=useStore(state=>state.settings.codeTrack),update=useStore(state=>state.updateSettings);
 const [previewTrack,setPreviewTrack]=useState<Track>(preferred);
 const track=explicitTrack??(preview?previewTrack:preferred);
 const Heading=embedded?"h2":"h1";
 const activeModuleHref=moduleHref.replace("/learn/java/",`/learn/${track}/`);
 return <div className={embedded?"learning-embedded-workspace":"learn-page"}><nav aria-label="Foundations breadcrumbs"><Link href="/learn/">Learn</Link>{courseTitle?<> / <Link href={activeModuleHref}>{courseTitle}</Link></>:null}</nav><p><Link href={activeModuleHref}>Back to the module</Link></p><Heading>{exercise.shared.translations.en.title}</Heading><nav className="learning-ribbon" aria-label="Exercise code track">{tracks.map(value=><button key={value} type="button" aria-pressed={track===value} onClick={()=>{if(preview)setPreviewTrack(value);else update({codeTrack:value});onTrackChange?.(value);}}>{trackNames[value]}</button>)}</nav><HumanLanguagePicker/><ExerciseTrack key={`${exercise.id}:${track}`} exercise={exercise} track={track} description={description} moduleHref={activeModuleHref} nextHref={nextHref} preview={preview} onAccepted={onAccepted}/></div>;
}
function ExerciseTrack({exercise,track,description,moduleHref,nextHref,preview,onAccepted}:{exercise:MultiTrackExercise;track:Track;description:ReactNode;moduleHref:string;nextHref?:string;preview:boolean;onAccepted?:()=>void}){
 const settings=useStore(state=>state.settings),learning=useStore(state=>state.learning);
 const part=exercise.variants[track],copy=translated(exercise.shared,settings.lessonLanguage);
 const [code,setCode]=useState(part?.starterCode??""),[loaded,setLoaded]=useState(false);
 const [visibleTests,setVisibleTests]=useState<TestCase[]>(exercise.cases);
 const allCases=useRef<TestCase[]>(exercise.cases);
 const [submittedAccepted,setSubmittedAccepted]=useState(false);
 const [running,setRunning]=useState(false),[result,setResult]=useState<RunResult|null>(null),[status,setStatus]=useState("");
 const [answer,setAnswer]=useState(""),[feedback,setFeedback]=useState("");
 const [confidence,setConfidence]=useState<1|2|3|null>(null),[hints,setHints]=useState(0),[custom,setCustom]=useState("");
 const controller=useRef<AbortController|null>(null),pack=useRef<MultiTrackExercisePrivate|null>(null),started=useRef<number|null>(null);
 const draft=useRef({code,loaded});draft.current={code,loaded};
 const [previewNotes,setPreviewNotes]=useState<Record<string,string>>({});
 const noWatch=useCallback(()=>{},[]);
 useEffect(()=>{started.current=Date.now();setCode(preview?part?.starterCode??"":storage.read(`drafts:${exercise.id}:${track}`,part?.starterCode??""));setLoaded(true);return()=>{controller.current?.abort();if(!preview&&draft.current.loaded)storage.write(`drafts:${exercise.id}:${track}`,draft.current.code);};},[exercise.id,track,part?.starterCode,preview]);
 useEffect(()=>{if(!loaded||preview)return;const timer=setTimeout(()=>storage.write(`drafts:${exercise.id}:${track}`,code),500);return()=>clearTimeout(timer);},[code,loaded,exercise.id,track,preview]);
 useEffect(()=>{const flush=()=>{if(!preview&&draft.current.loaded)storage.write(`drafts:${exercise.id}:${track}`,draft.current.code);};window.addEventListener("pagehide",flush);return()=>window.removeEventListener("pagehide",flush);},[exercise.id,track,preview]);
 if(!part)return <section role="status"><h2>Not available in {trackNames[track]} yet</h2><p>Your work in other tracks is safe. <Link href={moduleHref}>Return to the module</Link> or choose another track above.</p></section>;
 const course=exercise.track==="dsa"?"dsa":exercise.moduleId?.startsWith("cp2")?"cp2":"cp1";
 const unavailable=track==="java"&&!settings.judgeUrl.trim();
 const questionOnly=exercise.kind==="predict"||exercise.kind==="trace";
 const adaptation=suggestedRung(learning,track,exercise.conceptId??exercise.id);
 async function privatePack(){
  if(!pack.current){const response=await fetch(`/learn-data/exercise-${encodeURIComponent(exercise.id)}.json`);if(!response.ok)throw new Error("The exercise checks could not load.");const value=await response.json() as MultiTrackExercisePrivate;if(value.exerciseId!==exercise.id||!value.variants[track])throw new Error("The exercise checks do not match.");pack.current=value;}
  return pack.current;
 }
 function record(outcome:RunResult){
  setResult(outcome);setSubmittedAccepted(outcome.verdict==="accepted");if(preview){if(outcome.verdict==="accepted")onAccepted?.();return;}
  const store=useStore.getState(),now=Date.now(),correct=outcome.verdict==="accepted";
  store.setLearning({...store.learning,attempts:[...store.learning.attempts,{exerciseId:exercise.id,course,track,concept:exercise.conceptId??exercise.id,rung:exercise.rung??"write",at:now,correct,clean:correct&&hints===0,hints,confidence:confidence??1,durationMs:Math.max(0,now-(started.current??now))}]});
  started.current=now;
  if(correct){store.setFoundationsProgress({...store.foundations,[track]:{...store.foundations[track],exercisesSolved:{...store.foundations[track].exercisesSolved,[exercise.id]:true}}});onAccepted?.();}
 }
 async function execute(submit:boolean){
  if(running||(submit&&!confidence))return;
  if(!part)return;
  setRunning(true);setStatus("");setFeedback("");controller.current=new AbortController();const signal=controller.current.signal;
  try{
   if(questionOnly){const keys=(await privatePack()).variants[track]!;if(signal.aborted)return;const correct=answer.trim()===(keys.correctAnswer??keys.correctOptionId);setFeedback(`${correct?"Matched.":"Not yet."} ${translated(keys.explanations,settings.lessonLanguage).content.text}`);record({verdict:correct?"accepted":"wrong_answer",cases:[]});return;}
   let cases:TestCase[]=submit?[...exercise.cases,...(await privatePack()).hiddenCases]:exercise.cases;
   if(!submit&&custom.trim()){
    const customCases:unknown=JSON.parse(custom);
    if(!Array.isArray(customCases)||customCases.length>20||customCases.some(item=>!item||!Array.isArray(item.input)||!Object.hasOwn(item,"expected")||(exercise.ioMode==="program"&&typeof item.stdin!=="string")))throw new Error("Invalid custom cases");
    cases=[...cases,...customCases.map((item,index)=>({...item,id:`custom-${index}`}))];
   }
   if(signal.aborted)return;allCases.current=cases;setVisibleTests(submit?exercise.cases:cases);
   const {runCode}=await import("@/lib/runners");
   const outcome=await runCode(track,{code,functionName:part.functionName,mode:exercise.ioMode,cases,timeLimitMs:5000,javaParams:part.javaParams,strictTypes:track==="typescript",action:submit?"submit":"run"},settings,setStatus,signal);
   if(signal.aborted)return;
   if(submit)record(outcome);else setResult(outcome);
   setStatus(outcome.verdict==="accepted"?(submit?"Your program passes these checks. Explain one choice, or continue to the next exercise.":"Visible cases passed. Submit when you are ready to check the full set."):"Not yet. Inspect the first reported error or failing case, then change the program and try again.");
  }catch{if(!signal.aborted)setStatus("The exercise checks could not load. Your draft is still here. Check any custom-case JSON, then try again.");}
  finally{if(!signal.aborted)setRunning(false);}
 }
 return <>
  <section aria-label="Exercise statement">{copy.missing?<p>Not translated yet. This statement uses English.</p>:null}{copy.language==="en"?description:copy.content.statement.split("\n\n").map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p>Practice is quiet here. Explain notes, confidence and recall answers are not Watch integrity events.</p></section>
  {part.workedSteps?<section aria-label="Worked example steps">{translated(part.workedSteps,settings.lessonLanguage).content.steps.map((step,index)=><div className="learning-step" key={step.label}><h2>{step.label}</h2><pre>{step.code}</pre><label>{step.prompt}<textarea rows={2} value={(preview?previewNotes:learning.explanations)[`${exercise.id}:${track}:step-${index}`]??""} onChange={event=>{if(preview){setPreviewNotes(notes=>({...notes,[`${exercise.id}:${track}:step-${index}`]:event.target.value}));return;}const store=useStore.getState();store.setLearning({...store.learning,explanations:{...store.learning.explanations,[`${exercise.id}:${track}:step-${index}`]:event.target.value}});}}/></label><p>Your explanation is optional and stays on this device. It is not graded by AI.</p></div>)}</section>:null}
  <details><summary>Choose a hint</summary><p>Hints are optional. Use one when it helps you choose the next step.</p>{copy.content.hints.slice(0,hints).map((hint,index)=><p key={index}>{index+1}. {hint}</p>)}<button className="btn secondary" disabled={hints>=3} onClick={()=>setHints(count=>Math.min(3,count+1))}>Show next hint</button></details>
  {adaptation?<aside className="local-note"><p>{adaptation.reason}</p><Link href={moduleHref}>Choose a different rung on the module map</Link></aside>:null}
  <fieldset><legend>How sure are you before submitting?</legend><div className="learning-actions">{([1,2,3] as const).map(value=><button className="btn secondary" type="button" key={value} aria-pressed={confidence===value} onClick={()=>setConfidence(value)}>{["Not sure","Somewhat sure","Very sure"][value-1]}</button>)}</div></fieldset>
  {questionOnly?<section className="learning-step"><pre>{part.snippet??part.starterCode}</pre>{part.copy?.translations.en.options.length?<fieldset><legend>Your prediction</legend>{translated(part.copy,settings.lessonLanguage).content.options.map(option=><label className="learning-option" key={option.id}><input type="radio" name={`${exercise.id}-answer`} value={option.id} checked={answer===option.id} onChange={()=>setAnswer(option.id)}/>{option.text}</label>)}</fieldset>:<label>Your trace answer<input value={answer} onChange={event=>setAnswer(event.target.value)}/></label>}<button className="btn" disabled={!answer.trim()||!confidence||running} onClick={()=>void execute(true)}>Check answer</button><p role="status">{feedback}</p></section>
   :exercise.kind==="parsons"&&part.parsons?<Parsons draftId={preview?undefined:exercise.id} track={track} blocks={part.parsons.blocks} initialOrder={part.parsons.initialOrder} canSubmit={!!confidence} mode={exercise.ioMode} functionName={part.functionName} javaParams={part.javaParams} getCases={async()=>[...exercise.cases,...(await privatePack()).hiddenCases] as TestCase[]} onResult={record}/>
   :<section className="learning-step"><h2>Your solution</h2>{loaded?<div style={{height:360}}><CodeEditor code={code} onChange={setCode} language={track} onBurst={noWatch}/></div>:<EditorSkeleton/>}<div className="learning-actions"><button className="btn secondary" disabled={running||unavailable} onClick={()=>void execute(false)}>Run visible cases</button><button className="btn" disabled={running||!confidence||unavailable} onClick={()=>void execute(true)}>Submit solution</button></div></section>}
  {unavailable&&!questionOnly?<p>Run on your computer or set a Java backend in Settings. This exercise is not runnable in this browser without your configured endpoint.</p>:null}
  <p role="status">{status}</p>{result&&!questionOnly?<ResultsPanel result={result} tests={visibleTests} programMode={exercise.ioMode==="program"} failureStdin={allCases.current.find(test=>test.id===result.cases.find(item=>!item.passed)?.id)?.stdin} failureInput={allCases.current.find(test=>test.id===result.cases.find(item=>!item.passed)?.id)?.input} running={running} status={status} custom={custom} onCustom={setCustom}/>:null}
  {submittedAccepted?<section className="learning-step"><h2>One useful win</h2><p>Your solution passed these checks. What choice helped you get it working?</p><label>Explain to Tik (optional)<textarea rows={3} value={(preview?previewNotes:learning.explanations)[`${exercise.id}:${track}`]??""} onChange={event=>{if(preview){setPreviewNotes(notes=>({...notes,[`${exercise.id}:${track}`]:event.target.value}));return;}const store=useStore.getState();store.setLearning({...store.learning,explanations:{...store.learning.explanations,[`${exercise.id}:${track}`]:event.target.value}});}}/></label>{nextHref?<Link className="btn secondary" href={nextHref}>Next exercise</Link>:<Link href={moduleHref}>Choose your next module step</Link>}</section>:null}
 </>;
}
