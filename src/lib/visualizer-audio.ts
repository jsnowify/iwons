import type { VisualFrame } from "./visualizers";

// One small synthesis context per mounted board; no audio files or network requests.
// unlock() is called only from a user gesture, never during initial rendering.
export function createVisualizerAudio() {
  let context: AudioContext | null = null;
  return {
    unlock() {
      try { context ??= new AudioContext(); if(context.state==="suspended")void context.resume().catch(()=>{}); } catch { /* Audio is optional. */ }
    },
    tick(frame: VisualFrame, complete: boolean) {
      if(!context || context.state!=="running")return;
      try {
        const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
        const active=frame.cells.find(cell=>cell.highlighted);
        const value=Number(active?.value);
        const frequency=complete?880:220+(Number.isFinite(value)?Math.abs(value)%60:frame.cells.filter(cell=>cell.visited).length)*9;
        const duration=complete?0.18:0.075;
        oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency,now);
        if(complete)oscillator.frequency.exponentialRampToValueAtTime(1320,now+duration);
        gain.gain.setValueAtTime(0.001,now);gain.gain.exponentialRampToValueAtTime(0.035,now+0.008);gain.gain.exponentialRampToValueAtTime(0.001,now+duration);
        oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+duration+0.01);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      } catch { /* Muting or unsupported audio must never stop the algorithm. */ }
    },
    close() { if(context){void context.close().catch(()=>{});context=null;} },
  };
}
