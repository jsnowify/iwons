import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
const browser=await chromium.launch();
const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
const source=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8")).courses[0].modules[0];
const index=JSON.parse(fs.readFileSync("src/data/learning-rewards.json","utf8"));
const now=Date.parse("2026-10-16T15:59:59Z"),key="cp1:java:output:qa";
const progress=Object.fromEntries(["java","python","javascript","typescript"].map(track=>[track,{lessonsRead:{},exercisesSolved:{},checkpointScores:{}}]));
progress.java={lessonsRead:Object.fromEntries(source.lessons.map(lesson=>[lesson.id,true])),exercisesSolved:Object.fromEntries(index.moduleExercises[source.id].map(id=>[id,true])),checkpointScores:{[source.id]:{correct:5,total:5,at:now}}};
progress.python.exercisesSolved[index.exercises[0].id]=true;
const learning={recalls:{[key]:{cardId:"qa",course:"cp1",track:"java",concept:"output",step:1,due:now,successes:2,misses:0}},recallLog:["2026-10-14","2026-10-16","2026-10-16"].map(day=>({key,day,at:Date.parse(`${day}T04:00:00Z`),correct:true,rating:"Good"})),attempts:[],explanations:{},sessions:[],completedModules:{},importedChallenges:{},streakFreezes:[]};
try{
 for(const midnight of [false,true]){
  const context=await browser.newContext({viewport:{width:360,height:900},timezoneId:"Asia/Manila",reducedMotion:"reduce"});
  const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.clock.setFixedTime(now);
  await page.addInitScript(data=>{if(localStorage.getItem("iwons:v6:schemaVersion"))return;for(const [name,value]of Object.entries(data))localStorage.setItem(`iwons:v6:${name}`,JSON.stringify(value));},{schemaVersion:6,foundations:progress,learning,profile:{name:"QA",avatar:"Q",onboarded:true}});
  await page.goto(base+"/progress/");await page.getByText("Learning rewards and stamps",{exact:true}).click();
  const desk=page.getByRole("region",{name:"Learning progress",exact:true});
  await expect(desk).toContainText("261.25 learning XP.");await expect(desk).toContainText("Meet the language — Java module stamp");
  const freeze=page.getByRole("button",{name:"Use a freeze for 2026-10-15",exact:true});await expect(freeze).toBeVisible();
  if(midnight){await page.clock.setFixedTime(now+3000);await expect(freeze).toHaveCount(0);}
  else{await freeze.click();await expect(desk).toContainText("3 days in your local learning streak.");await expect(desk).toContainText("261.25 learning XP.");await page.reload();await page.getByText("Learning rewards and stamps",{exact:true}).click();await expect(desk).toContainText("3 days in your local learning streak.");}
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
 }
 fs.mkdirSync("artifacts/learning-engine",{recursive:true});fs.writeFileSync("artifacts/learning-engine/rewards.json",JSON.stringify({rewardDedup:true,quarterTrack:true,moduleStamp:true,freezePersistence:true,noFreezeXp:true,midnightRefresh:true})+"\n");
 console.log("Learning rewards: solve/quarter-track/recall totals, module stamp, persisted freeze and midnight refresh passed.");
}finally{await browser.close();}
