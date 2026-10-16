"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { calibration, conceptMastery } from "@/lib/foundations/learning-state";
import { courseNames, tracks, trackNames, type LearnCourseId, type LearnManifest, type Track } from "@/lib/foundations/model-v2";
import manifest from "@/data/foundations.json";
import rewardIndex from "@/data/learning-rewards.json";
import { learnRewards } from "@/lib/foundations/rewards-v2";
import { learningStreak, localLearningDay, moduleXp, recallRewards } from "@/lib/foundations/learning-rewards";
import { ProgressBar } from "./ui";

export function LearningProgress(){
 const learning=useStore(state=>state.learning),preferred=useStore(state=>state.settings.codeTrack);
 const [course,setCourse]=useState<LearnCourseId|"path">("cp1"),[selectedTrack,setTrack]=useState<Track|null>(null),[expanded,setExpanded]=useState(false);
 const progress=useStore(state=>state.foundations);
 const [today,setToday]=useState("");useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const refresh=()=>{const now=new Date();setToday(localLearningDay(now.getTime()));const midnight=new Date(now);midnight.setHours(24,0,0,50);clearTimeout(timer);timer=setTimeout(refresh,midnight.getTime()-now.getTime());};
  refresh();window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
  return()=>{clearTimeout(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[]);
 const rewards=learnRewards(manifest as LearnManifest,progress,rewardIndex.exercises,rewardIndex.moduleExercises);
 const finishedModules=rewards.stamps.flatMap(stamp=>stamp.modules.map(id=>({id,track:stamp.track,course:stamp.course})));
 const xp=rewards.xp+recallRewards(learning)+finishedModules.length*moduleXp;
 const streak=learningStreak(learning,today);
 const track=selectedTrack??preferred;
 const concepts=[...new Set([...learning.attempts.filter(item=>item.course===course&&item.track===track).map(item=>item.concept),...Object.values(learning.recalls).filter(item=>item.course===course&&item.track===track).map(item=>item.concept)])];
 const confidence=calibration(learning,course,track);
 return <section className="card fullspan" aria-label="Learning progress"><div className="card-heading"><h2>Your learning desk</h2><Link href="/learn/warm-up/">Daily Warm-up 3</Link></div><div className="learning-actions"><label>Course<select value={course} onChange={event=>setCourse(event.target.value as LearnCourseId|"path")}>{Object.entries({...courseNames,path:"Iwons Path"}).map(([value,title])=><option value={value} key={value}>{title}</option>)}</select></label><label>Code track<select value={track} onChange={event=>setTrack(event.target.value as Track)}>{tracks.map(track=><option key={track} value={track}>{trackNames[track]}</option>)}</select></label></div>
 <details><summary>Learning rewards and stamps</summary><p>{xp} learning XP. First solves earn full exercise credit; each additional code track earns one quarter. Successful recall earns 5 XP once per card per local day. Each finished module earns {moduleXp} XP per track. Time and unsuccessful attempts earn none.</p>{finishedModules.length?<ul>{finishedModules.map(stamp=><li key={`${stamp.id}:${stamp.track}`}>{courseNames[stamp.course]}: {(manifest as LearnManifest).courses.find(course=>course.id===stamp.course)?.modules.find(entry=>entry.id===stamp.id)?.title} &mdash; {trackNames[stamp.track]} module stamp</li>)}</ul>:<p>Finish a module&apos;s lessons, exercises and checkpoint to earn its stamp.</p>}{rewards.stamps.filter(stamp=>stamp.complete).map(stamp=><p key={`${stamp.course}:${stamp.track}`}>{courseNames[stamp.course]} in {trackNames[stamp.track]}: course stamp earned.</p>)}{rewards.polyglotCourses.map(course=><p key={course}>Polyglot: {courseNames[course]} completed in two or more tracks.</p>)}<p>{streak.days} days in your local learning streak. Successful solves and recalls count.</p>{streak.freezeDay?<button type="button" className="btn secondary" onClick={()=>{const store=useStore.getState();const currentDay=localLearningDay(Date.now());setToday(currentDay);const current=learningStreak(store.learning,currentDay);if(current.freezeDay&&current.freezeDay===streak.freezeDay)store.setLearning({...store.learning,streakFreezes:[...store.learning.streakFreezes,current.freezeDay]});}}>Use a freeze for {streak.freezeDay}</button>:null}<p>One optional freeze covers a missed day in each calendar week. A freeze preserves the streak and earns no XP.</p></details>
 <h3>Concept strength</h3>{concepts.length?<>{(expanded?concepts:concepts.slice(0,5)).map(concept=><div className="topic-row" key={concept}><p>{concept.replaceAll("-"," ")}</p><ProgressBar value={conceptMastery(learning,course,track,concept)} label={concept.replaceAll("-"," ")}/></div>)}{concepts.length>5?<button className="btn secondary" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Collapse concepts":"Expand concepts"}</button>:null}</>:<p>Complete a lesson or recall check to see strength built from your recent answers. Time spent alone does not raise it.</p>}
 <h3>Confidence and results</h3>{confidence.some(item=>item.attempts)?<ul>{confidence.map(item=><li key={item.confidence}>{["Not sure","Somewhat sure","Very sure"][item.confidence-1]}: {item.correct} correct out of {item.attempts} checks.</li>)}</ul>:<p>Before checking a program, choose how sure you feel. Your results will appear here so you can compare your estimate with what happened.</p>}
 <p>{learning.sessions.length} learning sessions saved on this device.</p><button className="btn secondary" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({app:"Iwons",format:"learning-data-1",courseNames,learning},null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="Iwons-learning-data.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Export learning data</button><p className="muted">Export only if you want a file. Learning data stays on this device.</p>
 </section>;
}
