"use client";
import { useEffect, useState } from "react";
import { LessonActivity } from "./lesson-activity";
import { Parsons } from "./parsons";
import { CloseTheBook } from "./close-the-book";
import checkpoint from "@/data/learning-checkpoint-demo.json";
import type { Checkpoint } from "@/lib/foundations/types";
import { tracks, trackNames, type Track } from "@/lib/foundations/model-v2";
import type { EngineLesson } from "@/lib/foundations/lesson-engine";

export function LearningDemo({ lesson }: { lesson:EngineLesson }) {
  const [track,setTrack]=useState<Track>("javascript");
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const blocks = track === "python" ? [{id:"first",code:'print("Ready")',indent:0},{id:"second",code:'print("Open")',indent:0}]
    : track === "java" ? [{id:"first",code:'public class Main { public static void main(String[] args) {',indent:0},{id:"second",code:'System.out.println("Ready"); System.out.println("Open");',indent:0},{id:"end",code:'} }',indent:0}]
    : [{id:"first",code:'console.log("Ready");',indent:0},{id:"second",code:'console.log("Open");',indent:0}];
  if(!ready)return <p role="status">Loading learning tools?</p>;
  return <><label>Demo code track<select value={track} onChange={event=>setTrack(event.target.value as Track)}>{tracks.map(track=><option key={track} value={track}>{trackNames[track]}</option>)}</select></label><LessonActivity key={track} lesson={lesson} track={track} moduleHref="/learn/" preview/><h2>Parsons keyboard check</h2><Parsons key={`blocks:${track}`} track={track} blocks={blocks} initialOrder={[...blocks].reverse().map(block=>block.id)} getCases={async()=>[{id:"two-lines",input:[],stdin:"",expected:"Ready\nOpen"}]}/><CloseTheBook key={`checkpoint:${track}`} checkpoint={checkpoint as Checkpoint} track={track} preview/></>;
}
