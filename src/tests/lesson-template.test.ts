import fs from "node:fs";
import { expect, it } from "vitest";
import demo from "@/data/learning-demo.json";
import { assembleParsons, matchesRecall, validateEngineLesson, type EngineLesson, type LessonKeys } from "@/lib/foundations/lesson-engine";
import { tracks } from "@/lib/foundations/model-v2";
import { executeLearningReference, executeLearningFunction } from "../../scripts/validate-learning-runtime";
import { validateLearningTranslations } from "../../scripts/validate-i18n";
import { validateLearningExercise } from "../../scripts/validate-learning-exercise";
import exerciseSamples from "@/data/learning-exercises-demo.json";
import type { MultiTrackExercise, MultiTrackExercisePrivate } from "@/lib/foundations/model-v2";

const lesson=demo as EngineLesson;
const keys=JSON.parse(fs.readFileSync("public/learn-data/tool-demo.json","utf8")) as LessonKeys;
it("requires varied PRIMM interactions, recall formats and actionable feedback",()=>{
 expect(validateEngineLesson(lesson,keys)).toEqual([]);
 const bad=structuredClone(lesson);bad.interactionTypes=["guess","guess","guess"];bad.tracks.java!.breakIt.translations.en.prompt="";
 expect(validateEngineLesson(bad,keys).join()).toContain("distinct");expect(validateEngineLesson(bad,keys).join()).toContain("Try to break it");
 expect(validateLearningTranslations(lesson).errors).toEqual([]);
 const wrongKeys=structuredClone(keys);wrongKeys.tracks.java!.recall["demo-word"].answer="Not a choice";
 expect(validateEngineLesson(lesson,wrongKeys).join()).toContain("answer must match a choice");
});
for(const track of tracks)it(`executes the ${track} tool example and modification in the native runtime`,()=>{
 const part=lesson.tracks[track]!,answers=keys.tracks[track]!;
 expect(executeLearningReference(track,part.code,[{stdin:part.stdin,expected:answers.expectedOutput}])).toBe(1);
 expect(executeLearningReference(track,answers.modify.referenceSolution,answers.modify.cases)).toBe(1);
},30000);
it("preserves meaningful capitalization when checking recall",()=>{
 expect(matchesRecall("Ready\n",keys.tracks.java!.predict)).toBe(true);
 expect(matchesRecall("ready",keys.tracks.java!.predict)).toBe(false);
 const terminology={answer:"quote",accepted:["quotation mark","quote mark"],caseSensitive:false,reason:"A quote ends a string boundary.",nextStep:"Read the boundary again."};
 expect(matchesRecall("Quotation mark",terminology)).toBe(true);
 expect(matchesRecall("apostrophe",terminology)).toBe(false);
});
it("assembles Python indentation without evaluating code or forcing a fixed order",()=>{
 const blocks=[{id:"a",code:"if True:",indent:0},{id:"b",code:'print("Ready")',indent:1}];
 expect(assembleParsons(blocks,["a","b"],"python")).toBe('if True:\n    print("Ready")');
 expect(()=>assembleParsons(blocks,["a","a"],"python")).toThrow();
 const independent=[{id:"a",code:'a = 1',indent:0},{id:"b",code:'b = 2',indent:0},{id:"c",code:'print(a + b)',indent:0}];
 for(const order of [["a","b","c"],["b","a","c"]])expect(executeLearningReference("python",assembleParsons(independent,order,"python"),[{stdin:"",expected:"3"}])).toBe(1);
});
for(const track of tracks)it(`validates ${track} function and structure operations against returned values`,()=>{
 const functions={java:"class Solution { int add(int a, int b) { return a+b; } }",python:"def add(a, b):\n    return a + b",javascript:"function add(a,b){return a+b;}",typescript:"function add(a:number,b:number):number{return a+b;}"};
 const structures={java:"class Counter { private int value=0; void add(int n){value+=n;} int read(){return value;} }",python:"class Counter:\n    def __init__(self): self.value = 0\n    def add(self, n): self.value += n\n    def read(self): return self.value",javascript:"class Counter{constructor(){this.value=0;}add(n){this.value+=n;}read(){return this.value;}}",typescript:"class Counter{private value:number=0;add(n:number):void{this.value+=n;}read():number{return this.value;}}"};
 expect(executeLearningFunction(track,functions[track],{functionName:"add",mode:"function",cases:[{id:"sum",input:[8,9],expected:17},{id:"zero",input:[0,0],expected:0}]})).toBe(2);
 expect(executeLearningFunction(track,structures[track],{functionName:"Counter",mode:"operations",cases:[{id:"counter",input:[["Counter","add","read"],[[],[7],[]]],expected:[null,null,7]}]})).toBe(1);
},30000);
for(const sample of exerciseSamples as unknown as MultiTrackExercise[])it(`executes every ${sample.kind} workspace sample case and alternative in four native runtimes`,()=>{
 const answers=JSON.parse(fs.readFileSync(`public/learn-data/exercise-${sample.id}.json`,"utf8")) as MultiTrackExercisePrivate;
 expect(validateLearningExercise(sample,answers).tracks).toBe(4);
 const bad=structuredClone(sample);Object.assign(bad,{correctAnswer:"leaked"});
 expect(()=>validateLearningExercise(bad,answers)).toThrow("Private");
},60000);
