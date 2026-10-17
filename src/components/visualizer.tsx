"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { VisualFrame } from "@/lib/visualizers";
import { createVisualizerAudio } from "@/lib/visualizer-audio";
import { useStore } from "@/store/use-store";

export function Visualizer({title,frames,sound,onSoundChange}:{title:string;frames:VisualFrame[];sound:boolean;onSoundChange:(enabled:boolean)=>void}) {
  const [index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(800),[systemReduced,setSystemReduced]=useState(false);
  const [predict,setPredict]=useState(false),[guess,setGuess]=useState(""),[feedback,setFeedback]=useState("");
  const motion=useStore(state=>state.settings.motion);
  const reduced=systemReduced||!motion;
  const audio=useRef<ReturnType<typeof createVisualizerAudio>|null>(null);
  const soundedIndex=useRef(0);
  useEffect(()=>{const query=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setSystemReduced(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);
  useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
  useEffect(()=>{
    if(!playing||reduced||index>=frames.length-1)return;
    const timer=setTimeout(()=>setIndex(current=>Math.min(frames.length-1,current+1)),speed);
    return()=>clearTimeout(timer);
  },[playing,reduced,speed,frames.length,index]);
  useEffect(()=>{
    if(index!==soundedIndex.current && sound && frames[index])audio.current?.tick(frames[index],index===frames.length-1);
    soundedIndex.current=index;
  },[index,frames,sound]);
  useEffect(()=>()=>{audio.current?.close();audio.current=null;},[]);
  const frame=frames[index];if(!frame)return <p>No steps are available.</p>;
  const last=index===frames.length-1;
  function unlockAudio(){if(sound){audio.current??=createVisualizerAudio();audio.current.unlock();}}
  function moveTo(next:number){unlockAudio();setPlaying(false);setGuess("");setFeedback("");setIndex(Math.max(0,Math.min(frames.length-1,next)));}
  return <section className="visualizer-stage" aria-label={title} data-stepped={index>0} tabIndex={0} onKeyDown={event=>{
    if(event.target!==event.currentTarget)return;
    if(event.key==="ArrowRight"&&!predict){event.preventDefault();moveTo(index+1);}
    if(event.key==="ArrowLeft"){event.preventDefault();moveTo(index-1);}
    if(event.key==="Home"){event.preventDefault();moveTo(0);}
    if(event.key==="End"){event.preventDefault();moveTo(frames.length-1);}
  }}>
    <div className="visual-stage-heading"><div><h2>{title}</h2><p className="muted">Step {index+1} of {frames.length}</p></div><button type="button" className="btn secondary sound-toggle" aria-label="Visualizer sound" aria-pressed={sound} onClick={()=>{if(!sound){audio.current??=createVisualizerAudio();audio.current.unlock();}onSoundChange(!sound);}}>{sound?<Volume2 size={18} aria-hidden="true"/>:<VolumeX size={18} aria-hidden="true"/>}Sound {sound?"on":"off"}</button></div>
    <div key={index} className="visual-cells" style={frame.columns?{gridTemplateColumns:`repeat(${frame.columns},minmax(0,1fr))`}:undefined}>{frame.cells.map(cell=><div className="visual-cell" data-highlighted={cell.highlighted} data-visited={cell.visited} key={cell.id}><strong>{cell.value}</strong><small>{cell.highlighted?"▶ ":""}{cell.label??`index ${cell.id}`}</small></div>)}</div>
    <div className="visual-explanation"><p aria-live="polite" aria-atomic="true">{frame.message}</p><pre>{frame.state}</pre></div>
    <div className="visual-controls">
      <button className="btn secondary" disabled={index===0} onClick={()=>moveTo(index-1)}>Step back</button>
      <button className="btn" disabled={reduced||last||predict} onClick={()=>{unlockAudio();setPlaying(value=>!value);}}>{playing&&!last?"Pause":"Play"}</button>
      <button className="btn secondary" disabled={last||predict} onClick={()=>moveTo(index+1)}>Step forward</button>
      <button className="btn secondary" onClick={()=>moveTo(0)}>Reset</button>
      <label>Speed<select value={speed} onChange={event=>setSpeed(Number(event.target.value))}><option value={1400}>Slow</option><option value={800}>Normal</option><option value={350}>Fast</option></select></label>
    </div>
    <div className="visual-prediction"><label className="interaction-option"><input type="checkbox" checked={predict} onChange={event=>{setPredict(event.target.checked);setPlaying(false);setFeedback("");}}/>Predict the next step</label>
    {predict&&!last?<form onSubmit={event=>{
      event.preventDefault();unlockAudio();const correct=guess.trim()===frames[index+1].state.trim();
      setFeedback(correct?"Prediction matched. Check the highlighted cards.":"Compare your prediction with the new state, then trace the changed cards.");
      setPlaying(false);setIndex(index+1);setGuess("");
    }}><label>Predict the next state (use the state format above)<input value={guess} onChange={event=>setGuess(event.target.value)}/></label><button className="btn secondary" disabled={!guess.trim()}>Check prediction and step</button></form>:null}
    {feedback?<p role="status">{feedback}</p>:null}</div>
    <p className="visual-help muted">Focus the board to use ← / →, Home or End. {reduced?"Reduced motion is on; use the step buttons.":"Sound starts only when you step or play; mute it anytime."}</p>
  </section>;
}
