import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
const browser=await chromium.launch();
const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
const root="src/data/learn/cp1/meet-the-language";
const manifest=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8")).courses[0].modules[0];
const report=[];
try{
 for(const theme of ["light","dark"])for(const track of ["java","python","javascript","typescript"]){
  const page=await browser.newPage({viewport:{width:360,height:900},reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const map=`${base}/learn/${track}/computer-programming-1/meet-the-language/`;
  await page.goto(map);await expect(page.getByRole("heading",{name:"Meet the language",exact:true})).toBeVisible();
  const themeButton=page.getByRole("button",{name:`Switch to ${theme} theme`,exact:true});if(await themeButton.count())await themeButton.click();
  await expect(page.getByRole("heading",{name:"Practice ladder",exact:true})).toBeVisible();
  for(const entry of manifest.lessons){
   const data=JSON.parse(fs.readFileSync(`${root}/lessons/${entry.slug}.json`,"utf8")),keys=JSON.parse(fs.readFileSync(`${root}/keys/${entry.slug}.json`,"utf8")).tracks[track];
   const response=await page.goto(`${map}${entry.slug}/`);const html=await response.text();
   for(const field of ['"referenceSolution"','"hiddenCases"','"expectedOutput"','"correctOptionId"'])assert(!html.includes(field),`Private field in HTML: ${field}`);
   await page.getByRole("textbox",{name:"Your guess slip",exact:true}).fill(keys.expectedOutput);
   await page.getByRole("button",{name:"Keep my guess and try it",exact:true}).click();
   const run=page.getByRole("button",{name:"Try it",exact:true});
   if(track==="java")await expect(run).toBeDisabled();else{await run.click();await page.getByText("Prediction matched.",{exact:false}).waitFor({timeout:120000});}
   await page.getByRole("button",{name:"3. Investigate",exact:true}).click();
   await page.getByRole("textbox",{name:data.tracks[track].trace.translations.en.question,exact:true}).fill(keys.trace.answer);
   await page.getByRole("button",{name:"Check trace",exact:true}).click();await page.getByText("Matched.",{exact:false}).waitFor();
   await page.getByRole("button",{name:"4. Modify",exact:true}).click();
   await page.getByRole("textbox",{name:"Your program",exact:true}).fill(keys.modify.referenceSolution);
   await page.getByRole("button",{name:"Very sure",exact:true}).click();
   if(track!=="java"){await page.getByRole("button",{name:"Check my change",exact:true}).click();await page.getByRole("textbox",{name:"Explain to Tik (optional)",exact:true}).waitFor({timeout:120000});}
   await page.getByRole("button",{name:"6. Recall",exact:true}).click();
   const card=page.locator(".learning-recall").first();const first=data.tracks[track].recallCards[0];
   await card.getByRole("radio",{name:keys.recall[first.id].answer,exact:true}).check();await card.getByRole("button",{name:"Check recall",exact:true}).click();await card.getByRole("button",{name:"Good",exact:true}).click();
   await page.getByRole("button",{name:"7. Recap",exact:true}).click();await page.getByRole("button",{name:"Finish lesson",exact:true}).click();
   await expect(page.getByRole("button",{name:"Lesson recorded",exact:true})).toBeDisabled();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   report.push({theme,track,lesson:entry.slug,passed:true});
  }
  await page.goto(map);const checkpoint=page.getByRole("region",{name:"Close the Book checkpoint",exact:true});
  const publicCheckpoint=JSON.parse(fs.readFileSync(`${root}/checkpoint.json`,"utf8"));const answers=JSON.parse(fs.readFileSync(`${root}/keys/checkpoint.json`,"utf8"));
  for(const question of publicCheckpoint.translations.en.questions){const answer=answers.answers.find(answer=>answer.questionId===question.id);await checkpoint.getByRole("radio",{name:question.options.find(option=>option.id===answer.correctOptionId).text,exact:true}).check();}
  await checkpoint.getByRole("button",{name:"Check recall",exact:true}).click();await expect(checkpoint).toContainText("5 of 5 recalled.");
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close();fs.mkdirSync("artifacts/learning-engine",{recursive:true});fs.writeFileSync("artifacts/learning-engine/first-module.json",JSON.stringify(report,null,2)+"\n");}
console.log(`First module: ${report.length} mounted lesson/track/theme flows passed, plus eight module/checkpoint probes.`);
