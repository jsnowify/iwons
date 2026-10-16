"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/store/use-store";
import { DailyWarmup, type WarmupEntry } from "./daily-warmup";
import { LessonActivity } from "./lesson-activity";
import { LearningWorkspace } from "./learning-workspace";
import { tracks, trackNames, type Track, type MultiTrackExercise } from "@/lib/foundations/model-v2";
import type { EngineLesson } from "@/lib/foundations/lesson-engine";
import type { ActiveLearningSession, LearningSession } from "@/lib/foundations/learning-state";

export interface SessionEntry { lessonId:string;title:string;exerciseId:string;track:Track;moduleHref:string }
interface SessionContent { lesson:EngineLesson;exercise:MultiTrackExercise }
export function TenMinuteSession({entries,catalogue,preview=false,previewData}:{entries:SessionEntry[];catalogue:WarmupEntry[];preview?:boolean;previewData?:SessionContent}){
 const learning=useStore(state=>state.learning),preferred=useStore(state=>state.settings.codeTrack),progress=useStore(state=>state.foundations);
 const [demoSession,setDemoSession]=useState<ActiveLearningSession|undefined>();
 const [data,setData]=useState<SessionContent|null>(previewData??null),[error,setError]=useState(""),[retry,setRetry]=useState(0);
 const [recap,setRecap]=useState<LearningSession|null>(null);
 const active=preview?demoSession:learning.activeSession;
 const selected=active?entries.find(entry=>entry.lessonId===active.lessonId&&entry.exerciseId===active.exerciseId&&entry.track===active.track):undefined;
 useEffect(()=>{
  if(!active||previewData)return;
  const controller=new AbortController();setData(null);setError("");
  void Promise.all([fetch(`/learn-public/${encodeURIComponent(active.lessonId)}.json`,{signal:controller.signal}),fetch(`/learn-public/exercise-${encodeURIComponent(active.exerciseId)}.json`,{signal:controller.signal})]).then(async responses=>{
   if(responses.some(response=>!response.ok))throw new Error("Missing session content");
   const [lesson,exercise]=await Promise.all(responses.map(response=>response.json())) as [EngineLesson,MultiTrackExercise];
   if(lesson.id!==active.lessonId||exercise.id!==active.exerciseId)throw new Error("Session content mismatch");
   if(!controller.signal.aborted)setData({lesson,exercise});
  }).catch(()=>{if(!controller.signal.aborted)setError("The session content could not load. Your place is saved; try loading it again.");});
  return()=>controller.abort();
 },[active?.lessonId,active?.exerciseId,previewData,retry]);
 function update(session:ActiveLearningSession|undefined){
  if(preview){setDemoSession(session);return;}
  const store=useStore.getState();store.setLearning({...store.learning,activeSession:session});
 }
 function start(){
  const available=entries.filter(entry=>entry.track===preferred);
  const entry=available.find(entry=>!progress[preferred].lessonsRead[entry.lessonId])??available[0];
  if(!entry)return;
  const now=Date.now();setRecap(null);update({id:`short-session:${now}`,track:entry.track,lessonId:entry.lessonId,exerciseId:entry.exerciseId,startedAt:now,phase:"warmup",recalled:[],revisit:[]});
 }
 function changeTrack(track:Track){
  if(!active)return;
  if(!entries.some(entry=>entry.track===track&&entry.lessonId===active.lessonId&&entry.exerciseId===active.exerciseId)){setError(`This session is not available in ${trackNames[track]} yet. Keep your current track, or return to the course map.`);return;}
  if(!preview)useStore.getState().updateSettings({codeTrack:track});setError("");update({...active,track});
 }
 function recallSummary(){
  if(!active||preview)return {recalled:active?.recalled??[],revisit:active?.revisit??[]};
  const events=useStore.getState().learning.recallLog.filter(event=>event.at>=active.startedAt);
  return {recalled:[...new Set([...active.recalled,...events.filter(event=>event.correct).map(event=>event.key)])],revisit:[...new Set([...active.revisit,...events.filter(event=>!event.correct).map(event=>event.key)])]};
 }
 function finish(completed:boolean){
  if(!active)return;
  const summary=recallSummary();
  const record:LearningSession={id:active.id,track:active.track,startedAt:active.startedAt,endedAt:Date.now(),recalled:summary.recalled,revisit:completed?summary.revisit:[...new Set([...summary.revisit,active.exerciseId])],completed:completed?[active.exerciseId]:[]};
  if(preview)setDemoSession(undefined);else{const store=useStore.getState();store.setLearning({...store.learning,activeSession:undefined,sessions:[...store.learning.sessions,record]});}
  setRecap(record);
 }
 return <section><h1>One small learning session</h1><p>Aim for about ten minutes: one warm-up recall, one Predict/Run step and one exercise. Stay longer if it helps. There is no countdown and no reward for time or attempts.</p>
  {!active&&!recap?<>{entries.some(entry=>entry.track===preferred)?<button className="btn" onClick={start}>Start a 10-minute session</button>:<div className="local-note"><h2>No ready session in {trackNames[preferred]} yet</h2><p>Sessions open when a lesson and its exercise pass the checks. The course maps remain available.</p><Link href="/learn/">Explore the course maps</Link></div>}</>:null}
  {active?<><nav className="learning-ribbon" aria-label="Session code track">{tracks.map(track=><button key={track} type="button" aria-pressed={active.track===track} onClick={()=>changeTrack(track)}>{trackNames[track]}</button>)}</nav><p>{active.phase==="warmup"?"1. Recall one idea":active.phase==="lesson"?"2. Predict, then try one example":"3. Try one exercise"}</p>{error?<div role="alert"><p>{error}</p><button className="btn secondary" onClick={()=>setRetry(value=>value+1)}>Try loading again</button></div>:null}
   {!selected?<p>This saved session is not available in the current course edition. End it to keep a recap, then choose another course step.</p>:!data&&!error?<p role="status">Loading your saved session…</p>:data?<>
    {active.phase==="warmup"?<><DailyWarmup key={active.track} catalogue={preview?[]:catalogue} compact limit={1} recordSession={false} onComplete={result=>update({...active,...result,phase:"lesson"})}/><button className="btn secondary" onClick={()=>update({...active,...recallSummary(),phase:"lesson"})}>Continue to the lesson step</button></>:null}
    {active.phase==="lesson"?<LessonActivity key={`${active.lessonId}:${active.track}`} lesson={data.lesson} track={active.track} moduleHref={selected.moduleHref} preview={preview} sessionStep onStepDone={()=>update({...active,phase:"exercise"})}/>:null}
    {active.phase==="exercise"?<LearningWorkspace exercise={data.exercise} description={<p>{data.exercise.shared.translations.en.statement}</p>} moduleHref={selected.moduleHref} explicitTrack={active.track} onTrackChange={changeTrack} preview={preview} onAccepted={()=>finish(true)} embedded/>:null}
   </>:null}<button className="btn secondary" onClick={()=>finish(false)}>End session and see recap</button></>:null}
  {recap?<div className="learning-session-summary"><h2>Your session recap</h2><p>{recap.recalled.length} successful recalls. {recap.completed.length} exercises passed. {recap.revisit.length} items to revisit.</p><p>{preview?"This was a tool preview. No learning records were changed.":"Your recap is saved on this device. Choose one item to review, or return to your module."}</p><Link className="btn secondary" href="/learn/">Choose your next course step</Link></div>:null}
 </section>;
}
