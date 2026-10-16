import { expect,it,vi } from "vitest";
import fs from "node:fs";
import {spawnSync} from "node:child_process";
import { validateLearnManifest } from "@/lib/foundations/validate-v2";
import { emptyLearnProgress, type LearnManifest } from "@/lib/foundations/model-v2";
import { migrateV4Data } from "@/lib/migrations/v5";
import { validateLearnProgress } from "@/lib/foundations/validate-progress-v2";
import { programShim,normalizeProgramOutput } from "@/lib/runners/program-shim";
import { binarySearchFrames,insertionSortFrames,gridBfsFrames } from "@/lib/foundations/visualizers";
import { learnRewards } from "@/lib/foundations/rewards-v2";
import { checkTypes } from "@/lib/runners/strict-types";
const manifest=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8")) as LearnManifest;
const units=[...new Set((JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8")) as {unit:string}[]).map(entry=>entry.unit))];
it("keeps every planned module visible and validates existing Path links",()=>{
 expect(validateLearnManifest(manifest,units)).toEqual([]);expect(manifest.courses).toHaveLength(3);expect(manifest.courses.flatMap(course=>course.modules)).toHaveLength(44);
 const broken=structuredClone(manifest);broken.courses[2].modules[0].practiceUnits=["missing-unit"];expect(validateLearnManifest(broken,units).join()).toContain("Unknown Path");
 const ready=structuredClone(manifest);ready.courses[0].modules[0].lessons[0].availability.java="ready";ready.courses[0].modules[0].lessons[0].variants={};expect(validateLearnManifest(ready,units).join()).toContain("Ready lesson missing");
});
it("moves legacy Foundations work to Java and leaves Path data intact",()=>{
 const foundations={lessonsRead:{l:true},exercisesSolved:{e:true},checkpointScores:{q:{correct:3,total:5,at:1}}};
 const original={foundations,progress:{p:true},notes:{p:"keep"},settings:{language:"python",lessonLanguage:"fil"}};
 const migrated=migrateV4Data(original);expect(migrated.foundations).toEqual({...emptyLearnProgress(),java:foundations});expect(migrated.progress).toEqual(original.progress);expect(migrated.settings).toMatchObject({codeTrack:"python",lessonLanguage:"fil"});expect(original.foundations).toBe(foundations);
 expect(()=>validateLearnProgress(migrated.foundations)).not.toThrow();expect(()=>validateLearnProgress(foundations)).toThrow();
});
it("normalizes trailing whitespace without discarding meaningful indentation",()=>{expect(normalizeProgramOutput(" a  \r\nb\n\n")).toBe(" a\nb");expect(normalizeProgramOutput(" a")).not.toBe("a");});
it("provides isolated virtual UTF-8 files and raw stdin",()=>{
 const shim=programShim("8 9\n",()=>{});const virtual=shim.require("fs") as {readFileSync:(p:string|number,e:string)=>string;writeFileSync:(p:string,v:string)=>void;existsSync:(p:string)=>boolean};
 expect(virtual.readFileSync(0,"utf8")).toBe("8 9\n");virtual.writeFileSync("log.txt","saved");expect(virtual.readFileSync("log.txt","utf8")).toBe("saved");expect(()=>virtual.writeFileSync("../escape","x")).toThrow();expect((programShim("",()=>{}).require("fs") as typeof virtual).existsSync("log.txt")).toBe(false);
});
it("drains readline events and its async iterator",async()=>{
 const shim=programShim("one\ntwo\n",()=>{});const reader=shim.require("readline") as {createInterface:()=>{on:(event:string,fn:(line?:string)=>void)=>unknown;[Symbol.asyncIterator]:()=>AsyncIterableIterator<string>}};
 const eventLines:string[]=[];const event=reader.createInterface();event.on("line",line=>eventLines.push(line!));event.on("close",()=>eventLines.push("closed"));
 const asyncLines:string[]=[];for await(const line of reader.createInterface())asyncLines.push(line);await shim.finish();expect(eventLines).toEqual(["one","two","closed"]);expect(asyncLines).toEqual(["one","two"]);
});
it("produces deterministic algorithm frames without mutating inputs",()=>{
 const input=[17,6,12,4];expect(insertionSortFrames(input).at(-1)!.cells.map(cell=>Number(cell.value))).toEqual([4,6,12,17]);expect(input).toEqual([17,6,12,4]);
 expect(binarySearchFrames([3,8,14],8).at(-1)!.message).toContain("index 1");expect(binarySearchFrames([],8).at(-1)!.message).toContain("absent");
 const grid=[[0,0],[1,0]];const frames=gridBfsFrames(grid,[0,0]);expect(frames.at(-1)!.message).toContain("3 squares");expect(frames).toEqual(gridBfsFrames(grid,[0,0]));
});
it("rewards one full solve and only a quarter for each additional track",()=>{
 const progress=emptyLearnProgress();progress.java.exercisesSolved.e=true;progress.python.exercisesSolved.e=true;expect(learnRewards(manifest,progress,[{id:"e",xp:20}],{}).xp).toBe(25);expect(learnRewards(manifest,progress,[{id:"e",xp:20}],{}).polyglotCourses).toEqual([]);
});
it("checks semantic TypeScript errors using the installed compiler and local standard library",async()=>{
 vi.stubGlobal("fetch",async(url:string)=>({ok:true,text:async()=>fs.readFileSync(`public/runners/ts-lib/${url.split('/').at(-1)}`,"utf8")}));
 try {expect(await checkTypes('const total: number = "wrong";')).toEqual(expect.arrayContaining([expect.objectContaining({line:1,message:expect.stringContaining("not assignable")})]));expect(await checkTypes('const total: number = 17; console.log(total);')).toEqual([]);}finally{vi.unstubAllGlobals();}
});
it("keeps Python operations and raw stdin working in the exact harness",()=>{
 const harness=fs.readFileSync("public/runners/harness.py","utf8");
 for(const request of [
  {code:'a, b = map(int, input().split())\nprint(a+b)',mode:"program",functionName:"main",cases:[{id:"input",input:[],stdin:"8 9\n",expected:"17"}]},
  {code:'class Counter:\n def __init__(self): self.value = 0\n def add(self, n): self.value += n\n def read(self): return self.value',mode:"operations",functionName:"Counter",cases:[{id:"ops",input:[["Counter","add","read"],[[],[7],[]]],expected:[null,null,7]}]},
 ]){
  const source='iwons_request = '+JSON.stringify(JSON.stringify(request))+'\n'+harness.replace('json.dumps(iwons_execute(json.loads(iwons_request)))','print(json.dumps(iwons_execute(json.loads(iwons_request))))');
  const result=spawnSync("python",["-c",source],{encoding:"utf8",timeout:10000});expect(result.status,result.stderr).toBe(0);const response=JSON.parse(result.stdout);expect(response.verdict).toBe("accepted");expect(response.cases[0].actual).toEqual(request.mode==="program"?"17\n":[null,null,7]);
 }
});
