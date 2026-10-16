"use client";
import { useState } from "react";
import type { Checkpoint, CheckpointPrivate } from "@/lib/foundations/types";
import type { Track } from "@/lib/foundations/model-v2";
import { translated } from "@/lib/foundations/translations";
import { useStore } from "@/store/use-store";

export function CloseTheBook({ checkpoint, track, preview=false }: { checkpoint:Checkpoint;track:Track;preview?:boolean }) {
  const language=useStore(state=>state.settings.lessonLanguage);
  const copy=translated(checkpoint,language);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [result,setResult]=useState<CheckpointPrivate|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function check(){
    setBusy(true);setError("");
    try{
      const response=await fetch(`/learn-data/checkpoint-${encodeURIComponent(checkpoint.id)}.json`);
      if(!response.ok)throw new Error("Missing checkpoint pack");
      const keys=await response.json() as CheckpointPrivate;
      if(keys.checkpointId!==checkpoint.id||keys.answers.length!==copy.content.questions.length)throw new Error("Mismatched checkpoint");
      setResult(keys);
      if(!preview){const store=useStore.getState();const correct=keys.answers.filter(key=>answers[key.questionId]===key.correctOptionId).length;
        const previous=store.foundations[track].checkpointScores[checkpoint.moduleId];
        if(!previous||correct>=previous.correct)store.setFoundationsProgress({...store.foundations,[track]:{...store.foundations[track],checkpointScores:{...store.foundations[track].checkpointScores,[checkpoint.moduleId]:{correct,total:keys.answers.length,at:Date.now()}}}});
      }
    }catch{setError("The checkpoint checks could not load. Your answers are still here; try Check recall again.");}
    finally{setBusy(false);}
  }
  return <section className="learning-step" aria-label="Close the Book checkpoint"><h2>Close the Book</h2><p>Try recalling without opening the lesson. Choose an answer for every question, then check the explanations. You can revisit the module and try again.</p>{copy.missing?<p>Not translated yet. This checkpoint uses English.</p>:null}
    <form onSubmit={event=>{event.preventDefault();void check();}}>{copy.content.questions.map((question,index)=><fieldset key={question.id} disabled={busy||!!result}><legend>{index+1}. {question.prompt}</legend>{question.options.map(option=><label className="learning-option" key={option.id}><input type="radio" name={question.id} value={option.id} checked={answers[question.id]===option.id} onChange={()=>setAnswers(current=>({...current,[question.id]:option.id}))}/>{option.text}</label>)}{result?<p>{answers[question.id]===result.answers.find(key=>key.questionId===question.id)?.correctOptionId?"Recalled. ":"Not yet. "}{result.answers.find(key=>key.questionId===question.id)?.explanations[language]??result.answers.find(key=>key.questionId===question.id)?.explanations.en}</p>:null}</fieldset>)}
    {!result?<button className="btn" disabled={busy||copy.content.questions.some(question=>!answers[question.id])}>{busy?"Checking…":"Check recall"}</button>:<button className="btn secondary" type="button" onClick={()=>{setAnswers({});setResult(null);}}>Try recalling again</button>}</form>{error?<p role="alert">{error}</p>:null}{result?<p role="status">{result.answers.filter(key=>answers[key.questionId]===key.correctOptionId).length} of {result.answers.length} recalled. Revisit the explanations for any misses, then choose your next module step.</p>:null}
  </section>;
}
