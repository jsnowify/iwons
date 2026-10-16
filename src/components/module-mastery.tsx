"use client";
import { useStore } from "@/store/use-store";
import { conceptMastery } from "@/lib/foundations/learning-state";
import type { LearnCourseId, Track } from "@/lib/foundations/model-v2";
import { ProgressBar } from "./ui";
export function ModuleMastery({course,track,concepts}:{course:LearnCourseId;track:Track;concepts:string[]}){
 const learning=useStore(state=>state.learning);
 if(!concepts.length)return null;
 return <details><summary>Concept strength</summary>{concepts.map(concept=><div className="topic-row" key={concept}><p>{concept.replaceAll("-"," ")}</p><ProgressBar label={concept.replaceAll("-"," ")} value={conceptMastery(learning,course,track,concept)}/></div>)}</details>;
}
