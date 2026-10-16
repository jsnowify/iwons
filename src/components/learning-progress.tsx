"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { calibration, conceptMastery } from "@/lib/foundations/learning-state";
import { courseNames, tracks, trackNames, type LearnCourseId, type Track } from "@/lib/foundations/model-v2";
import { ProgressBar } from "./ui";

export function LearningProgress(){
 const learning=useStore(state=>state.learning),preferred=useStore(state=>state.settings.codeTrack);
 const [course,setCourse]=useState<LearnCourseId|"path">("cp1"),[selectedTrack,setTrack]=useState<Track|null>(null),[expanded,setExpanded]=useState(false);
 const track=selectedTrack??preferred;
 const concepts=[...new Set([...learning.attempts.filter(item=>item.course===course&&item.track===track).map(item=>item.concept),...Object.values(learning.recalls).filter(item=>item.course===course&&item.track===track).map(item=>item.concept)])];
 const confidence=calibration(learning,course,track);
 return <section className="card fullspan" aria-label="Learning progress"><div className="card-heading"><h2>Your learning desk</h2><Link href="/learn/warm-up/">Daily Warm-up 3</Link></div><div className="learning-actions"><label>Course<select value={course} onChange={event=>setCourse(event.target.value as LearnCourseId|"path")}>{Object.entries({...courseNames,path:"Iwons Path"}).map(([value,title])=><option value={value} key={value}>{title}</option>)}</select></label><label>Code track<select value={track} onChange={event=>setTrack(event.target.value as Track)}>{tracks.map(track=><option key={track} value={track}>{trackNames[track]}</option>)}</select></label></div>
 <h3>Concept strength</h3>{concepts.length?<>{(expanded?concepts:concepts.slice(0,5)).map(concept=><div className="topic-row" key={concept}><p>{concept.replaceAll("-"," ")}</p><ProgressBar value={conceptMastery(learning,course,track,concept)} label={concept.replaceAll("-"," ")}/></div>)}{concepts.length>5?<button className="btn secondary" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Collapse concepts":"Expand concepts"}</button>:null}</>:<p>Complete a lesson or recall check to see strength built from your recent answers. Time spent alone does not raise it.</p>}
 <h3>Confidence and results</h3>{confidence.some(item=>item.attempts)?<ul>{confidence.map(item=><li key={item.confidence}>{["Not sure","Somewhat sure","Very sure"][item.confidence-1]}: {item.correct} correct out of {item.attempts} checks.</li>)}</ul>:<p>Before checking a program, choose how sure you feel. Your results will appear here so you can compare your estimate with what happened.</p>}
 <p>{learning.sessions.length} learning sessions saved on this device.</p><button className="btn secondary" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({app:"Iwons",format:"learning-data-1",courseNames,learning},null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="Iwons-learning-data.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Export learning data</button><p className="muted">Export only if you want a file. Learning data stays on this device.</p>
 </section>;
}
