import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { validateEngineLesson, type EngineLesson, type LessonKeys } from "../src/lib/foundations/lesson-engine.ts";
import { tracks, type LearnManifest, type Track } from "../src/lib/foundations/model-v2.ts";
import { validateLearningModule } from "./validate-learning-module.ts";
import { executeLearningReference } from "./validate-learning-runtime.ts";
import { assertLearningPublicContent } from "../src/lib/foundations/privacy.ts";

const manifest=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8")) as LearnManifest;
const moduleId=process.argv[2];assert(moduleId,"Supply a draft module ID.");
const course=manifest.courses.find(course=>course.modules.some(entry=>entry.id===moduleId));assert(course,"Unknown module");
const entry=course.modules.find(entry=>entry.id===moduleId)!;
assert.equal(entry.status,"draft","This command validates draft execution, never publication.");
const root=path.join("src/data/learn",course.id,entry.slug);
const introduced=Object.fromEntries(tracks.map(track=>[track,new Set<string>()])) as Record<Track,Set<string>>;
const snapshots=new Map<string,typeof introduced>();
let lessonCases=0;
for(const item of entry.lessons){
 const lesson=JSON.parse(fs.readFileSync(path.join(root,"lessons",`${item.slug}.json`),"utf8")) as EngineLesson;
 const keys=JSON.parse(fs.readFileSync(path.join(root,"keys",`${item.slug}.json`),"utf8")) as LessonKeys;
 assertLearningPublicContent(lesson);assert.deepEqual(validateEngineLesson(lesson,keys),[]);
 for(const track of tracks){
  const part=lesson.tracks[track]!,privatePart=keys.tracks[track]!;
  for(const [concept,id]of Object.entries(lesson.introducedIn[track]??{}))if(id===lesson.id)introduced[track].add(concept);
  lessonCases+=executeLearningReference(track,part.code,[{stdin:part.stdin,expected:privatePart.expectedOutput}]);
  lessonCases+=executeLearningReference(track,privatePart.modify.referenceSolution,privatePart.modify.cases);
 }
 snapshots.set(lesson.id,Object.fromEntries(tracks.map(track=>[track,new Set(introduced[track])])) as typeof introduced);
}
const result=validateLearningModule(course,entry,snapshots,false);
console.log(JSON.stringify({moduleId,draftExecutionPassed:true,lessonCases,...result,reviewStillRequired:true}));
