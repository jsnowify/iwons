"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics" | "patterns" | "overview" | "complexity">;
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { problemUrl } from "@/lib/presentation";
import { warmUpQueue } from "@/lib/warm-up";
import { rateReview, type Rating } from "@/lib/srs";
import { Inline } from "./inline-code";

export function WarmUp({problems}:{problems:CatalogEntry[]}){
 const store=useStore(),[queue,setQueue]=useState<string[]|null>(null),[index,setIndex]=useState(0),[answer,setAnswer]=useState(""),[revealed,setRevealed]=useState(false);
 const problem=queue?problems.find(problem=>problem.id===queue[index]):undefined;
 function start(){
  setQueue(warmUpQueue(problems,store.srs,store.progress,Date.now()));setIndex(0);setAnswer("");setRevealed(false);
 }
 function rate(rating:Rating){
  if(!problem)return;const previous=store.srs.find(review=>review.problemId===problem.id)??{problemId:problem.id,step:0,due:Date.now()};
  store.setReviews([...store.srs.filter(review=>review.problemId!==problem.id),rateReview(previous,rating)]);
  setIndex(value=>value+1);setAnswer("");setRevealed(false);
 }
 return <div className="content"><div className="page-heading"><div><div className="eyebrow">A SMALL START.</div><h1>Daily Warm-up 3</h1><p>Recall up to three familiar Path problems. Due reviews come first. Take your time; this is quiet practice, without Watch events or XP for attempts.</p></div></div>{queue===null?<button className="btn" disabled={!store.hydrated} onClick={start}>Find today’s cards</button>:problem?<section className="card"><p>Card {index+1} of {queue.length}</p><h2>{problem.title}</h2><p>Without opening your old solution, what steps would you use? Which edge case would you check?</p><label>Your recall<textarea rows={4} value={answer} disabled={revealed} onChange={event=>setAnswer(event.target.value)}/></label>{revealed?<><div className="screen-note"><strong>{problem.patterns.join(", ")}</strong><p><Inline text={problem.overview} /></p><p>Time: {problem.complexity.time}. Space: {problem.complexity.space}.</p></div>{store.notes[problem.id]?<pre className="prose-code">{store.notes[problem.id]}</pre>:null}<p>Compare your explanation, then rate how recalling felt. This is self-review, not an automatic grade.</p><div className="option-row">{(["Again","Hard","Good","Easy"] as Rating[]).map(rating=><button className="btn secondary" key={rating} onClick={()=>rate(rating)}>{rating}</button>)}</div><Link href={problemUrl(problem)}>Open this problem</Link></>:<button className="btn secondary" disabled={!answer.trim()} onClick={()=>setRevealed(true)}>Show approach</button>}</section>:<section className="card"><h2>{queue.length?"Your warm-up is complete.":"A fresh page for now."}</h2><p>{queue.length?"Your review schedule is saved on this device. Pick one idea to practise next.":"Solve a Path problem to add a familiar idea. Existing notes and review schedules stay on this device."}</p><Link className="btn" href="/path/">Explore the Path</Link></section>}</div>;
}
