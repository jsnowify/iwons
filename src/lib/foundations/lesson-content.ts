import fs from "node:fs";
import path from "node:path";
import { learnManifest } from "./learn";
import { tracks, type Track, type MultiTrackExercise, type LearnCourse, type LearnModule } from "./model-v2";
import type { EngineLesson, EngineModule } from "./lesson-engine";
import type { WarmupEntry } from "@/components/daily-warmup";
import type { SessionEntry } from "@/components/ten-minute-session";
import { courseSlugs } from "./model-v2";

export function readLesson(contentFile:string):EngineLesson {
  const root=path.resolve("src/data/learn");const file=path.resolve(root,contentFile);
  if(!file.startsWith(root+path.sep))throw new Error("Invalid lesson content path");
  return JSON.parse(fs.readFileSync(file,"utf8")) as EngineLesson;
}
export function readModuleFile<T>(courseId:string,moduleSlug:string,name:string):T {
  const root=path.resolve("src/data/learn",courseId,moduleSlug),file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep))throw new Error("Invalid module content path");
  return JSON.parse(fs.readFileSync(file,"utf8")) as T;
}
export function readModule(courseId:string,moduleSlug:string):EngineModule {
  return readModuleFile<EngineModule>(courseId,moduleSlug,"module.json");
}
export function recallCatalogue():WarmupEntry[] {
  return learnManifest.courses.flatMap(course=>course.modules.flatMap(module=>module.lessons.filter(lesson=>lesson.status==="ready").flatMap(lesson=>tracks.flatMap(track=>{
    const variant=lesson.variants[track];if(lesson.availability[track]!=="ready"||!variant)return [];
    const content=readLesson(variant.contentFile);return content.tracks[track]?.recallCards.map(card=>({lessonId:lesson.id,course:course.id,track:track as Track,card}))??[];
  }))));
}
export interface LearningExerciseEntry { exercise:MultiTrackExercise; course:LearnCourse; module:LearnModule }
export function getLearnExercises():LearningExerciseEntry[]{
  return learnManifest.courses.flatMap(course=>course.modules.filter(module=>module.status==="ready").flatMap(module=>{
    const directory=path.resolve("src/data/learn",course.id,module.slug);
    const index=JSON.parse(fs.readFileSync(path.join(directory,"module.json"),"utf8")) as {exerciseFiles:string[]};
    return index.exerciseFiles.map(name=>{
      const file=path.resolve(directory,name);if(!file.startsWith(directory+path.sep))throw new Error("Invalid exercise content path");
      return {exercise:JSON.parse(fs.readFileSync(file,"utf8")) as MultiTrackExercise,course,module};
    });
  }));
}
export function sessionEntries():SessionEntry[]{
 const exercises=getLearnExercises();
 return learnManifest.courses.flatMap(course=>course.modules.filter(station=>station.status==="ready").flatMap(station=>station.lessons.flatMap(lesson=>tracks.flatMap(track=>{
  if(lesson.availability[track]!=="ready")return [];
  const linked=exercises.filter(entry=>entry.module.id===station.id&&entry.exercise.afterLessonId===lesson.id&&entry.exercise.variants[track]);
  const chosen=linked.find(entry=>entry.exercise.rung==="write")??linked.find(entry=>entry.exercise.rung==="completion")??linked[0];
  return chosen?[{lessonId:lesson.id,title:lesson.title,exerciseId:chosen.exercise.id,track,moduleHref:`/learn/${track}/${courseSlugs[course.id]}/${station.slug}/`}]:[];
 }))));
}
