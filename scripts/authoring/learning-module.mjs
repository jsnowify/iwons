import fs from "node:fs";
import path from "node:path";
export const codeTracks=["java","python","javascript","typescript"];
export const translatedCopy=en=>({translations:{en,fil:null,ceb:null},translationStatus:{en:"reviewed",fil:"draft",ceb:"draft"}});
export function printLine(track,expression){return track==="java"?`System.out.println(${expression});`:track==="python"?`print(${expression})`:`console.log(${expression});`;}
export function program(track,lines){return track==="java"?`public class Main {\n    public static void main(String[] args) {\n${lines.map(line=>`        ${line}`).join("\n")}\n    }\n}`:lines.join("\n");}
export function authorLearningModule(config){
 const root=path.join("scripts/learning-content",config.course,config.slug);
 const save=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n");};
 const manifest=[];
 for(const [index,definition]of config.lessons.entries()){
  const id=`${config.id}-l${index+1}`,concept=definition.concept;
  const lesson={id,moduleId:config.id,course:config.course,slug:definition.slug,concepts:[concept],introducedIn:Object.fromEntries(codeTracks.map(track=>[track,{[concept]:id}])),interactionTypes:["guess","run","trace","change","quiz"],opening:"predict",estimatedMinutes:7,shared:translatedCopy(Object.fromEntries(["title","story","idea","make","recap"].map(key=>[key,definition[key]]))),tracks:{}};
  const keys={lessonId:id,tracks:{}};
  const ladder=config.exercises.flatMap((exercise,number)=>exercise.lesson===index?[{exerciseId:`${config.id}-e${number+1}`,slug:exercise.slug,title:exercise.title,rung:exercise.rung,concept}]:[]);
  for(const track of codeTracks){
   const details=definition.variant(track);
   const recallCards=definition.recalls.map((card,number)=>({id:`${id}-recall-${number+1}`,concept,format:card.format,copy:translatedCopy({prompt:card.prompt,...(card.options?{options:card.options}:{})})}));
   lesson.tracks[track]={code:details.code,stdin:definition.stdin??"",annotations:translatedCopy({items:details.annotations}),notes:translatedCopy({items:details.notes}),predict:translatedCopy({prompt:definition.predict}),trace:translatedCopy({steps:details.trace,question:definition.traceQuestion}),modify:translatedCopy({prompt:definition.modify}),commonMistakes:translatedCopy({items:definition.mistakes}),breakIt:translatedCopy({prompt:details.breakIt}),recallCards,ladder,skippedRungs:["worked","completion","parsons","fix","write"].filter(rung=>!ladder.some(item=>item.rung===rung)).map(rung=>({concept,rung,reason:definition.skippedReason}))};
   keys.tracks[track]={expectedOutput:typeof definition.expected==="object"?definition.expected[track]:definition.expected,predict:{answer:typeof definition.expected==="object"?definition.expected[track]:definition.expected,reason:definition.predictReason,nextStep:definition.predictNext},trace:{answer:definition.traceAnswer,reason:definition.traceReason,nextStep:definition.traceNext},modify:{cases:definition.modifyCases??[{id:"changed",stdin:definition.stdin??"",expected:typeof definition.changedExpected==="object"?definition.changedExpected[track]:definition.changedExpected}],referenceSolution:details.modified},recall:Object.fromEntries(definition.recalls.map((card,number)=>[recallCards[number].id,{answer:card.answer,...(card.accepted?{accepted:card.accepted}:{}),...(card.caseSensitive===false?{caseSensitive:false}:{}),reason:card.reason,nextStep:card.nextStep}]))};
  }
  save(`lessons/${definition.slug}.json`,lesson);save(`keys/${definition.slug}.json`,keys);
  manifest.push({id,slug:definition.slug,title:definition.title,status:"draft",availability:Object.fromEntries(codeTracks.map(track=>[track,"draft"])),languages:["en"],variants:Object.fromEntries(codeTracks.map(track=>[track,{concepts:[concept],introducedIn:{[concept]:id},contentFile:`${config.course}/${config.slug}/lessons/${definition.slug}.json`}]))});
 }
 for(const [index,spec]of config.exercises.entries()){
  const id=`${config.id}-e${index+1}`,concept=config.lessons[spec.lesson].concept;
  const exercise={id,slug:spec.slug,moduleId:config.id,afterLessonId:manifest[spec.lesson].id,kind:spec.kind,track:config.course==="dsa"?"dsa":"foundations",ioMode:spec.ioMode??"program",rung:spec.rung,conceptId:concept,javaMinVersion:8,xp:spec.xp??20,shared:translatedCopy({title:spec.title,statement:spec.statement,hints:spec.hints}),cases:spec.cases,variants:{}};
  const keys={exerciseId:id,hiddenCases:spec.hiddenCases??[],variants:{}};
  for(const track of codeTracks){
   const details=spec.variant(track);
   exercise.variants[track]={starterCode:details.starterCode,functionName:details.functionName??"main",concepts:[concept,...(spec.previousConcepts??[])],introducedIn:{...(config.prerequisites??{}),...Object.fromEntries(config.lessons.slice(0,spec.lesson+1).map((lesson,index)=>[lesson.concept,manifest[index].id]))},...(details.parsons?{parsons:details.parsons}:{}),...(details.snippet?{snippet:details.snippet}:{}),...(details.options?{copy:translatedCopy({options:details.options})}:{}),...(details.workedSteps?{workedSteps:translatedCopy({steps:details.workedSteps})}:{}),...(details.javaParams?{javaParams:details.javaParams}:{})};
   keys.variants[track]={referenceSolution:details.referenceSolution,explanations:translatedCopy({text:details.explanation}),...(details.correctAnswer?{correctAnswer:details.correctAnswer}:{}),...(details.correctOptionId?{correctOptionId:details.correctOptionId}:{}),...(details.alternativeOrders?{alternativeOrders:details.alternativeOrders}:{})};
  }
  save(`exercises/${spec.slug}.json`,exercise);save(`keys/exercise-${spec.slug}.json`,keys);
 }
 save("checkpoint.json",{id:`${config.id}-checkpoint`,moduleId:config.id,...translatedCopy({questions:config.checkpoint.map(({id,prompt,options})=>({id,prompt,options}))})});
 save("keys/checkpoint.json",{checkpointId:`${config.id}-checkpoint`,answers:config.checkpoint.map(question=>({questionId:question.id,correctOptionId:question.correctOptionId,explanations:{en:question.explanation,fil:null,ceb:null}}))});
 save("module.json",{id:config.id,course:config.course,slug:config.slug,copy:translatedCopy({title:config.title,intro:config.intro,recallPrompt:config.recallPrompt}),lessonFiles:config.lessons.map(lesson=>`lessons/${lesson.slug}.json`),exerciseFiles:config.exercises.map(exercise=>`exercises/${exercise.slug}.json`),checkpointFile:"checkpoint.json"});
 save("manifest.json",{id:config.id,slug:config.slug,status:"draft",availability:Object.fromEntries(codeTracks.map(track=>[track,"draft"])),lessons:manifest,...(config.beforeYouStart?{beforeYouStart:config.beforeYouStart}:{})});
 console.log(`${config.title}: ${config.lessons.length} lessons and ${config.exercises.length} exercises authored as drafts.`);
}
