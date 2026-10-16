import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import type { EngineModule } from "../src/lib/foundations/lesson-engine";
import type { LearnCourse, LearnModule, MultiTrackExercise, MultiTrackExercisePrivate, Track } from "../src/lib/foundations/model-v2";
import { tracks } from "../src/lib/foundations/model-v2.ts";
import type { Checkpoint, CheckpointPrivate } from "../src/lib/foundations/types";
import { validateLearningExercise } from "./validate-learning-exercise.ts";
import { validateLearningTranslations } from "./validate-i18n.ts";
import { assertLearningPublicContent } from "../src/lib/foundations/privacy.ts";

type IntroductionMap=Map<string,Record<Track,Set<string>>>;
export function validateLearningModule(course:LearnCourse,entry:LearnModule,availableAt:IntroductionMap,requireReview=true){
 const directory=path.resolve("src/data/learn",course.id,entry.slug);
 const read=<T>(name:string):T=>{const file=path.resolve(directory,name);assert(file.startsWith(directory+path.sep),"Module path escapes its directory");return JSON.parse(fs.readFileSync(file,"utf8"));};
 const index=read<EngineModule>("module.json");
 assertLearningPublicContent(index);
 assert.equal(index.id,entry.id);assert.equal(index.course,course.id);assert.equal(index.slug,entry.slug);
 const words=index.copy.translations.en.intro.trim().split(/\s+/).length;
 assert(words>=150&&words<=250,`${entry.id}: module introduction needs 150–250 words`);
 assert(index.copy.translations.en.recallPrompt.trim(),"End the introduction with a recall question.");
 assert.deepEqual(validateLearningTranslations(index.copy).errors,[]);
 assert(index.lessonFiles.length===entry.lessons.length&&new Set(index.lessonFiles).size===entry.lessons.length,"Module lesson-file index must match its manifest.");
 assert.deepEqual([...index.lessonFiles].sort(),entry.lessons.map(lesson=>`lessons/${lesson.slug}.json`).sort(),"Module lesson files differ from its manifest.");
 const capstone=course.id!=="dsa"&&course.modules.indexOf(entry)===11;
 const count=index.exerciseFiles.length;
 assert(capstone?count===3:course.id==="dsa"?count>=5&&count<=8:count>=8&&count<=10,`${entry.id}: incorrect exercise count for this module`);
 assert.equal(new Set(index.exerciseFiles).size,count,"Duplicate exercise file");
 const exercises=index.exerciseFiles.map(file=>read<MultiTrackExercise>(file));
 assert.equal(new Set(exercises.map(exercise=>exercise.id)).size,count,"Duplicate exercise ID");
 assert.equal(new Set(exercises.map(exercise=>exercise.slug)).size,count,"Duplicate exercise slug");
 if(capstone)assert(exercises.every(exercise=>exercise.kind==="project"),"Capstones need three complete projects.");
 let executions=0;
 const requiredFiles=["module.json",...index.lessonFiles];
 for(const file of index.lessonFiles){const name=path.basename(file,".json");requiredFiles.push(`keys/${name}.json`);}
 for(const exercise of exercises){
  assert.equal(exercise.moduleId,entry.id);
  assert(entry.lessons.some(lesson=>lesson.id===exercise.afterLessonId),"Exercise must follow a lesson in this module.");
  const keyFile=`keys/exercise-${exercise.slug}.json`;
  requiredFiles.push(keyFile);
  const result=validateLearningExercise(exercise,read<MultiTrackExercisePrivate>(keyFile),availableAt.get(exercise.afterLessonId!));executions+=result.cases;
 }
 requiredFiles.push(...index.exerciseFiles,index.checkpointFile,"keys/checkpoint.json");
 const checkpoint=read<Checkpoint>(index.checkpointFile),keys=read<CheckpointPrivate>("keys/checkpoint.json");
 assertLearningPublicContent(checkpoint);
 assert.equal(checkpoint.moduleId,entry.id);assert.equal(keys.checkpointId,checkpoint.id);
 const questions=checkpoint.translations.en.questions;
 assert(course.id==="dsa"?questions.length>=5&&questions.length<=8:questions.length===5,"Checkpoint question count does not match the course.");
 assert.equal(new Set(questions.map(question=>question.id)).size,questions.length,"Duplicate checkpoint question");
 assert.equal(keys.answers.length,questions.length,"Checkpoint answer count mismatch");
 assert.deepEqual(validateLearningTranslations(checkpoint).errors,[]);
 for(const question of questions){
  const answer=keys.answers.find(answer=>answer.questionId===question.id);
  assert(question.prompt.trim()&&question.options.length>=2&&answer,"Incomplete checkpoint question");
  assert.equal(new Set(question.options.map(option=>option.id)).size,question.options.length,"Duplicate checkpoint option");
  assert(question.options.some(option=>option.id===answer.correctOptionId),"Invalid checkpoint key");
  for(const language of ["en","fil","ceb"] as const){
   assert(Object.hasOwn(answer.explanations,language),"Explicitly mark a missing checkpoint translation.");
   const translated=checkpoint.translations[language];if(!translated)continue;
   assert(answer.explanations[language]?.trim(),"Translated checkpoint needs translated feedback.");
   const translatedQuestion=translated.questions.find(item=>item.id===question.id);
   assert(translatedQuestion&&translatedQuestion.options.map(option=>option.id).join()===question.options.map(option=>option.id).join(),"Keep checkpoint IDs and answer order unchanged across human languages.");
  }
  assert(/\b(?:try|check|trace|read|compare|change|run|return|inspect|follow|count|move|replace|start)\b/i.test(answer.explanations.en),"Checkpoint feedback needs a next step.");
 }
 if(!requireReview)return {exercises:count,executions,checkpointQuestions:questions.length};
 const review=read<{agentId:string;openDefects:string[];engagement:Record<string,string>;reviewedFiles:Record<string,string>;samples:Partial<Record<Track,{lessonIds:string[];exerciseIds:string[];checkpoint:boolean}>>}>("review.json");
 assert(review.agentId?.trim()&&Array.isArray(review.openDefects)&&review.openDefects.length===0,"Independent review has missing evidence or unresolved defects.");
 for(const question of ["engagement","variety","passiveScreens","nextSteps"])assert(review.engagement[question]?.trim().length>=30,`Review must answer ${question} with concrete evidence.`);
 for(const track of entry.limitedTracks??tracks){const sample=review.samples[track];assert(sample&&sample.lessonIds.length>=1&&sample.exerciseIds.length>=2&&sample.checkpoint,`${track}: review one lesson, two exercises and the checkpoint`);assert(sample.lessonIds.every(id=>entry.lessons.some(lesson=>lesson.id===id))&&sample.exerciseIds.every(id=>exercises.some(exercise=>exercise.id===id)),"Review samples must identify actual module content.");}
 for(const name of requiredFiles){const file=path.resolve(directory,name);assert(file.startsWith(directory+path.sep),"Review path escapes its module");assert.equal(review.reviewedFiles[name],createHash("sha256").update(fs.readFileSync(file)).digest("hex"),`${entry.id}: review evidence is missing or stale for ${name}`);}
 return {exercises:count,executions,checkpointQuestions:questions.length};
}
