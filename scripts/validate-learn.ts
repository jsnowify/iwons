import fs from "node:fs";
import { validateLearnManifest } from "../src/lib/foundations/validate-v2.ts";
import { tracks, type LearnManifest, type LearnCourseId } from "../src/lib/foundations/model-v2.ts";
import { validateReadyLearningContent } from "./validate-learning-content.ts";
export function validateLearnStructure(onlyCourses?:LearnCourseId[]) {
 const manifest=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8")) as LearnManifest;
 const curriculum=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8")) as {unit:string}[];
 const errors=validateLearnManifest(manifest,[...new Set(curriculum.map(entry=>entry.unit))]);
 if(errors.length)throw new Error(errors.join("\n"));
 const lessons=manifest.courses.flatMap(course=>course.modules.flatMap(entry=>entry.lessons));
 const ready=lessons.filter(lesson=>lesson.status==="ready");
 const execution=onlyCourses?onlyCourses.map(course=>({course,...validateReadyLearningContent(manifest,course)})):validateReadyLearningContent(manifest);
 console.log(JSON.stringify({schemaVersion:2,courses:manifest.courses.length,modules:manifest.courses.reduce((sum,course)=>sum+course.modules.length,0),plannedLessons:lessons.length-ready.length,readyLessons:ready.length,tracks,structurePassed:true,contentExecution:ready.length?execution:"No ready content. Java browser availability is independent of local authoring validation."}));
 return manifest;
}
