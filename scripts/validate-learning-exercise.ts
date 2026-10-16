import assert from "node:assert/strict";
import { tracks, type Track, type MultiTrackExercise, type MultiTrackExercisePrivate } from "../src/lib/foundations/model-v2.ts";
import { assembleParsons } from "../src/lib/foundations/lesson-engine.ts";
import { courseNamingErrors } from "../src/lib/foundations/naming.ts";
import { validateLearningTranslations } from "./validate-i18n.ts";
import { executeLearningReference, executeLearningFunction } from "./validate-learning-runtime.ts";
import { assertLearningPublicContent } from "../src/lib/foundations/privacy.ts";

export function validateLearningExercise(exercise:MultiTrackExercise,keys:MultiTrackExercisePrivate,introduced?:Partial<Record<Track,Set<string>>>){
 assertLearningPublicContent(exercise);
 assert(exercise.id&&exercise.slug&&exercise.moduleId&&exercise.afterLessonId&&exercise.rung&&exercise.conceptId,"Exercise identity, order, rung and concept are required.");
 assert.equal(keys.exerciseId,exercise.id,"Mismatched exercise checks");
 assert.deepEqual(courseNamingErrors(exercise.shared.translations.en.title+" "+exercise.shared.translations.en.statement),[]);
 assert(!/\b(?:cp1|cp2|dsa)\b/i.test(exercise.slug!),"Use a descriptive learner-facing exercise URL.");
 assert.deepEqual(validateLearningTranslations(exercise.shared).errors,[]);
 assert(exercise.shared.translations.en.statement.trim().split(/\s+/).length>=20,"Give a complete, unambiguous statement.");
 const hints=exercise.shared.translations.en.hints;assert(hints.length===3&&new Set(hints).size===3&&hints.every(hint=>hint.trim()),"Use three distinct progressive hints.");
 const available=exercise.tracks??tracks;
 assert(available.length&&new Set(available).size===available.length&&available.every(track=>tracks.includes(track)),"Invalid available tracks.");
 if(available.length<4)assert(exercise.limitedReason?.trim(),"A limited-track exercise needs a teaching reason.");
 const questionOnly=exercise.kind==="predict"||exercise.kind==="trace";
 const cases=[...exercise.cases,...keys.hiddenCases];
 if(["code","program","build","project"].includes(exercise.kind)){
  assert.equal(exercise.cases.length,3,"Code/program/build exercises need three visible cases.");assert(keys.hiddenCases.length>=5,"Code/program/build exercises need five or more hidden cases.");
 }
 if(!questionOnly){
  assert(cases.length>0&&new Set(cases.map(test=>test.id)).size===cases.length,"Runnable exercises need unique case IDs.");
  for(const test of cases){assert(Array.isArray(test.input)&&Object.hasOwn(test,"expected"),"Malformed case");if(exercise.ioMode==="program")assert(typeof test.stdin==="string"&&typeof test.expected==="string","Program cases need raw stdin and output strings.");}
 }
 let executions=0;
 for(const track of available){
  const part=exercise.variants[track],privatePart=keys.variants[track];assert(part&&privatePart,`Missing ${track} exercise variant or keys`);
  assert(!Object.hasOwn(part,"cases")&&!Object.hasOwn(part,"expected"),"All tracks must use the shared cases.");
  assert(part.concepts.length>0&&part.concepts.includes(exercise.conceptId!),"Declare concepts per track.");
  if(introduced?.[track])for(const concept of part.concepts)assert(introduced[track]!.has(concept),`${exercise.id}/${track}: concept ${concept} is used before introduction`);
  const explanation=privatePart.explanations.translations.en.text;assert(explanation.trim()&&/\b(?:try|check|trace|read|compare|change|run|return|inspect|follow|count|move|replace|start)\b/i.test(explanation),"Answer feedback needs a concrete next step.");
  assert.deepEqual(validateLearningTranslations(privatePart.explanations).errors,[]);
  if(exercise.rung==="worked")assert(part.workedSteps?.translations.en.steps.length&&part.workedSteps.translations.en.steps.every(step=>step.label.trim()&&step.code.trim()&&step.prompt.trim()),"Worked examples need subgoal labels and an explanation/prediction prompt per step.");
  if(questionOnly){
   assert(part.snippet?.trim(),"Trace/predict exercises need a per-track snippet.");
   if(privatePart.correctOptionId)assert(part.copy?.translations.en.options.some(option=>option.id===privatePart.correctOptionId),"Invalid prediction answer key");
   else assert(privatePart.correctAnswer?.trim(),"Missing trace answer key");
   continue;
  }
  assert(privatePart.referenceSolution.trim()&&part.starterCode.trim(),"Runnable variants need source and starter code.");
  const run=(source:string)=>exercise.ioMode==="program"?executeLearningReference(track,source,cases.map(test=>({stdin:test.stdin!,expected:String(test.expected)}))):executeLearningFunction(track,source,{functionName:part.functionName,mode:exercise.ioMode,cases});
  executions+=run(privatePart.referenceSolution);
  if(exercise.kind==="parsons"){
   assert(part.parsons&&part.parsons.blocks.length>=2,"Parsons needs code blocks.");
   assert(part.parsons.blocks.every(block=>block.id&&Number.isInteger(block.indent)&&block.indent>=0),"Invalid Parsons indentation.");
   if(/^cp1-m[1-6]$/.test(exercise.moduleId!))assert(!part.parsons.distractors?.length,"No distractors in the first half of Computer Programming 1.");
   assert(privatePart.alternativeOrders?.length,"List at least the working reference order.");
   for(const order of privatePart.alternativeOrders!)executions+=run(assembleParsons(part.parsons.blocks,order,track));
  }
 }
 return {exerciseId:exercise.id,tracks:available.length,cases:executions};
}
