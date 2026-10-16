import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { assertLearningPublicContent } from "../src/lib/foundations/privacy.ts";
import { validateLearningModule } from "./validate-learning-module.ts";
import { pathToFileURL } from "node:url";
import { validateEngineLesson, type EngineLesson, type LessonKeys } from "../src/lib/foundations/lesson-engine.ts";
import { courseNamingErrors } from "../src/lib/foundations/naming.ts";
import { validateLearningTranslations } from "./validate-i18n.ts";
import { executeLearningReference } from "./validate-learning-runtime.ts";
import { tracks, type LearnManifest, type LearnCourseId } from "../src/lib/foundations/model-v2.ts";

const read=<T>(file:string):T=>JSON.parse(fs.readFileSync(file,"utf8"));
const blocked=fs.readFileSync("scripts/blocklist.txt","utf8").split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("#"));
function proseChecks(value:unknown,location:string){
  const serialized=JSON.stringify(value);
  assert(!/lorem ipsum|\bTODO\b|\bTBD\b/i.test(serialized),`${location}: placeholder prose`);
  for(const phrase of blocked)assert(!serialized.toLowerCase().includes(phrase.toLowerCase()),`${location}: blocked source phrase ${phrase}`);
  assert.deepEqual(courseNamingErrors(serialized),[],`${location}: abbreviated course name`);
  const translation=validateLearningTranslations(value,location);assert.deepEqual(translation.errors,[]);
}
export function validateReadyLearningContent(manifest:LearnManifest,onlyCourse?:LearnCourseId){
  let lessons=0,variants=0,cases=0,cards=0,exercises=0;
  const known=Object.fromEntries(tracks.map(track=>[track,new Set<string>()])) as Record<typeof tracks[number],Set<string>>;
  const availableAt=new Map<string,typeof known>();
  for(const course of manifest.courses)for(const station of course.modules)for(const lesson of station.lessons){
    if(lesson.status!=="ready")continue;
    for(const track of tracks)for(const [concept,id]of Object.entries(lesson.variants[track]?.introducedIn??{}))if(id===lesson.id)known[track].add(concept);
    availableAt.set(lesson.id,Object.fromEntries(tracks.map(track=>[track,new Set(known[track])])) as typeof known);
  }
  for(const course of manifest.courses.filter(course=>!onlyCourse||course.id===onlyCourse))for(const courseModule of course.modules){
    const directory=path.resolve("src/data/learn",course.id,courseModule.slug);
    for(const entry of courseModule.lessons.filter(lesson=>lesson.status==="ready")){
      assert.equal(courseModule.status,"ready",`${entry.id}: publish only with a complete reviewed module`);
      const files=[...new Set(tracks.flatMap(track=>entry.variants[track]?.contentFile?[entry.variants[track]!.contentFile]:[]))];
      assert.equal(files.length,1,`${entry.id}: use one shared concept file, not duplicated human-language source`);
      assert.equal(files[0],`${course.id}/${courseModule.slug}/lessons/${entry.slug}.json`,"Lesson filename must match the manifest.");
      const file=path.resolve("src/data/learn",files[0]);assert(file.startsWith(directory+path.sep),`${entry.id}: content path escapes its module`);
      const lesson=read<EngineLesson>(file),keys=read<LessonKeys>(path.join(directory,"keys",`${entry.slug}.json`));
      assert.equal(lesson.id,entry.id);assert.equal(lesson.moduleId,courseModule.id);assert.equal(lesson.course,course.id);
      assertLearningPublicContent(lesson);assert.deepEqual(validateEngineLesson(lesson,keys),[]);
      proseChecks(lesson.shared,entry.id);
      for(const track of tracks){
        if(entry.availability[track]!=="ready")continue;
        const part=lesson.tracks[track],answers=keys.tracks[track];assert(part&&answers,`${entry.id}: missing ${track} content or keys`);
        for(const copy of [part.predict,part.trace,part.commonMistakes,part.modify,part.breakIt,part.annotations,part.notes,...part.recallCards.map(card=>card.copy)].filter(Boolean))proseChecks(copy,`${entry.id}/${track}`);
        cases+=executeLearningReference(track,part.code,[{stdin:part.stdin,expected:answers.expectedOutput}]);
        cases+=executeLearningReference(track,answers.modify.referenceSolution,answers.modify.cases);
        cards+=part.recallCards.length;variants++;
      }
      lessons++;
    }
    if(courseModule.status==="ready"){
      assert(courseModule.lessons.every(lesson=>lesson.status==="ready"),`${courseModule.id}: open module has unfinished lessons`);
      assert((courseModule.limitedTracks??tracks).every(track=>courseModule.availability[track]==="ready"),`${courseModule.id}: every track needs a ready variant or an explicit reviewed exception`);
      if(courseModule.limitedTracks)assert(courseModule.limitedReason?.trim(),"A limited module needs a teaching reason.");
      assert(fs.existsSync(path.join(directory,"module.json")),`${courseModule.id}: missing module intro/exercise/checkpoint index`);
      assert(fs.existsSync(path.join(directory,"review.json")),`${courseModule.id}: missing independent review evidence`);
      const result=validateLearningModule(course,courseModule,availableAt);exercises+=result.exercises;cases+=result.executions;
    }
  }
  return {lessons,variants,cases,cards,exercises};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const manifest=read<LearnManifest>("src/data/foundations.json");
  console.log(JSON.stringify(validateReadyLearningContent(manifest)));
}
