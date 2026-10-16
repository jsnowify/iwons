"use client";
import { localLearningDay } from "@/lib/foundations/learning-rewards";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/store/use-store";
import type { RecallCard as Card, LessonKeys } from "@/lib/foundations/lesson-engine";
import type { LearnCourseId, Track } from "@/lib/foundations/model-v2";
import { dailyShuffle, rateRecall, recallKey } from "@/lib/foundations/learning-state";
import { RecallCard } from "./recall-card";

export interface WarmupEntry { lessonId:string; course:LearnCourseId; track:Track; card:Card }
export function DailyWarmup({ catalogue,limit=3,compact=false,onComplete,recordSession=true }: { catalogue:WarmupEntry[];limit?:number;compact?:boolean;recordSession?:boolean;onComplete?:(result:{recalled:string[];revisit:string[]})=>void }) {
  const track=useStore(state=>state.settings.codeTrack);
  const learning=useStore(state=>state.learning);
  const progress=useStore(state=>state.foundations);
  const [queue,setQueue]=useState<WarmupEntry[]|null>(null),[position,setPosition]=useState(0);
  const [started,setStarted]=useState(0),[revisit,setRevisit]=useState<string[]>([]),[recalled,setRecalled]=useState<string[]>([]);
  const [ended,setEnded]=useState(false),[extended,setExtended]=useState(false);
  function start() {
    const now=Date.now();
    const eligible=catalogue.filter(item=>progress[item.track].lessonsRead[item.lessonId] && (learning.recalls[recallKey(item.course,item.track,item.card.concept,item.card.id)]?.due ?? 0)<=now);
    const day=new Date(now).toLocaleDateString("en-CA");
    const preferred=dailyShuffle(eligible.filter(item=>item.track===track).map(item=>({...item,id:`${item.track}:${item.card.id}`})),day,track);
    const others=dailyShuffle(eligible.filter(item=>item.track!==track).map(item=>({...item,id:`${item.track}:${item.card.id}`})),day,track);
    setQueue([...preferred,...others].slice(0,limit));setPosition(0);setStarted(now);setEnded(false);setExtended(false);setRevisit([]);setRecalled([]);
  }
  const current=queue?.[position];
  const complete=queue!==null && (!current || ended);
  return <section>
    {compact?<h2>One warm-up recall</h2>:<h1>Daily Warm-up 3</h1>}<p>Recall a little before learning something new. {compact?"One due card comes":"Three due cards come"} from lessons you finished, starting with your current code track. Recall can feel difficult; check the example after a miss and try again.</p>
    {!queue ? <button className="btn" onClick={start}>Find today’s cards</button> : null}
    {current && !ended ? <RecallCard key={`${position}:${current.track}:${current.card.id}`} card={current.card} getAnswer={async()=>{const response=await fetch(`/learn-data/${encodeURIComponent(current.lessonId)}.json`);if(!response.ok)throw new Error("Could not load recall checks");const keys=await response.json() as LessonKeys;return keys.tracks[current.track]!.recall[current.card.id];}} onRate={(correct,rating)=>{
      const now=Date.now();const store=useStore.getState();const key=recallKey(current.course,current.track,current.card.concept,current.card.id);
      const previous=store.learning.recalls[key]??{cardId:current.card.id,course:current.course,track:current.track,concept:current.card.concept,step:0,due:now,successes:0,misses:0};
      store.setLearning({...store.learning,recalls:{...store.learning.recalls,[key]:rateRecall(previous,rating,correct,now)},recallLog:[...store.learning.recallLog,{key,at:now,day:localLearningDay(now),correct,rating:correct?rating:"Again"}]});
      const nextRevisit=correct?revisit:[...new Set([...revisit,key])];const nextRecalled=correct?[...recalled,key]:recalled;
      setRevisit(nextRevisit);setRecalled(nextRecalled);
      const next=[...queue!];if(!correct)next.splice(Math.min(position+3,next.length),0,current);
      setQueue(next);setPosition(position+1);
      const end=position+1>=next.length || (!extended && now-started>=5*60000);
      if(end){setEnded(true);const latest=useStore.getState();if(recordSession)latest.setLearning({...latest.learning,sessions:[...latest.learning.sessions,{id:`warmup:${now}`,track,startedAt:started,endedAt:now,recalled:nextRecalled,revisit:nextRevisit,completed:[]}]});onComplete?.({recalled:nextRecalled,revisit:nextRevisit});}
    }}/> : null}
    {complete ? <div className="learning-session-summary"><h2>{queue.length ? "Your warm-up recap" : "No cards are due yet"}</h2><p>{queue.length ? `${recalled.length} successful recalls. ${revisit.length} cards to revisit.` : "Finish a lesson to add its recall cards. Your earlier Path work stays where it is."}</p>{ended && current ? <button className="btn secondary" onClick={()=>{setExtended(true);setEnded(false);}}>Continue with the remaining cards</button>:null}<p><Link href="/learn/">Choose your next lesson</Link></p></div>:null}
  </section>;
}
