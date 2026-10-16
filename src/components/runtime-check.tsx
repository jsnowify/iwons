"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { runCode } from "@/lib/runners";
import { tracks, trackNames, type Track } from "@/lib/foundations/model-v2";
import type { RunResult } from "@/lib/types";
const probes:Record<Track,{hello:string;input:string;classes?:string}> = {
 java:{hello:'public class Main { public static void main(String[] args) { System.out.println("Ready"); } }',input:'import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner in = new Scanner(System.in); System.out.println(in.nextInt() + in.nextInt()); } }',classes:'class Desk { int total() { return 17; } } public class Main { public static void main(String[] args) { System.out.println(new Desk().total()); } }'},
 javascript:{hello:'console.log("Ready");',input:'const fs = require("fs"); const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number); console.log(values[0] + values[1]);'},
 typescript:{hello:'const message: string = "Ready"; console.log(message);',input:'const values: number[] = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/).map(Number); console.log(values[0] + values[1]);'},
 python:{hello:'print("Ready")',input:'a, b = map(int, input().split())\nprint(a + b)'},
};
export function RuntimeCheck() {
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const settings=useStore(state=>state.settings);
 const [track,setTrack]=useState<Track>("javascript"),[code,setCode]=useState(probes.javascript.hello),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[results,setResults]=useState<{name:string;result:RunResult}[]>([]);
 async function execute(smoke:boolean,action:"run"|"submit"="run") {
   controller.current?.abort();controller.current=new AbortController();const signal=controller.current.signal;
   setBusy(true);setResults([]);
   const cases=smoke ? [{name:"Hello World",code:probes[track].hello,stdin:"",expected:"Ready"},{name:"Standard input",code:probes[track].input,stdin:"8 9\n",expected:"17"},...(probes[track].classes?[{name:"Two classes",code:probes[track].classes!,stdin:"",expected:"17"}]:[])] : [{name:"Your program",code,stdin:"8 9\n",expected:"Ready"}];
   try {for(const probe of cases) {if(signal.aborted)break;const result=await runCode(track,{code:probe.code,mode:"program",functionName:"main",cases:[{id:probe.name,input:[],stdin:probe.stdin,expected:probe.expected}],timeLimitMs:5000,strictTypes:track==="typescript",action},settings,setStatus,signal);if(!signal.aborted)setResults(current=>[...current,{name:probe.name,result}]);}} finally {if(!signal.aborted){setBusy(false);setStatus("");}}
 }
 return <section><h2>Check your runtime</h2><p>These checks execute in disposable workers. Java needs your configured endpoint; the other tracks run in this browser. Python’s first run needs a runtime download.</p><label>Runtime track<select disabled={busy} value={track} onChange={event=>{const next=event.target.value as Track;setTrack(next);setCode(probes[next].hello);setResults([]);}}>{tracks.map(value=><option key={value} value={value}>{trackNames[value]}</option>)}</select></label><button className="btn" disabled={busy} onClick={()=>execute(true)}>Check Hello World and input</button><p role="status">{status}</p><label>Program source<textarea rows={9} value={code} onChange={event=>setCode(event.target.value)} spellCheck={false}/></label><p>Scratch check input: 8 9. Expected output: Ready. Virtual files last only for this test run. The JavaScript input shim provides UTF-8 fs and readline, not the complete Node platform.</p><div className="hero-actions"><button className="btn secondary" disabled={busy} onClick={()=>execute(false)}>Run scratch check</button><button className="btn secondary" disabled={busy} onClick={()=>execute(false,"submit")}>Check submission types</button></div><div aria-live="polite">{results.map(({name,result})=><article className="learn-runtime-result" key={name}><h3>{name}: {result.verdict.replaceAll("_"," ")}</h3>{result.runtimeVersion?<p>Python interpreter: {result.runtimeVersion}</p>:null}{result.compileError?<p>{result.compileError.message}</p>:null}{result.diagnostics?.map((diagnostic,index)=><p key={index}>TypeScript line {diagnostic.line??"?"}: {diagnostic.message}</p>)}{result.diagnostics?.length && result.verdict!=="compile_error"?<p>Run continued with type warnings. Submission is blocked until these errors are fixed.</p>:null}{result.cases.map(test=><pre key={test.id}>{test.stdout||test.error||String(test.actual)}</pre>)}</article>)}</div></section>;
}
