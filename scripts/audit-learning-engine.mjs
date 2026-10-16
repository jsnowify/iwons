import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
const browser=await chromium.launch();
const report=[];fs.mkdirSync("artifacts/learning-engine",{recursive:true});
try{
 for(const theme of ["light","dark"])for(const track of ["java","python","javascript","typescript"]){
  const page=await browser.newPage({viewport:{width:360,height:900},reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const response=await page.goto(`${base}/design/learning/`,{timeout:120000});
  assert.equal(response?.status(),200,"The development learning tool must be available.");
  const html=await response.text();assert(!html.includes('"referenceSolution"'));assert(!html.includes("Ready is the original message inside the quotes."));
  await page.getByRole("heading",{name:"Learning tool checks",exact:true}).waitFor();
  const themeButton=page.getByRole("button",{name:`Switch to ${theme} theme`,exact:true});if(await themeButton.count())await themeButton.click();
  await page.getByRole("combobox",{name:"Demo code track",exact:true}).selectOption(track);
  await page.getByRole("textbox",{name:"Your guess slip",exact:true}).fill("Ready");
  await page.getByRole("button",{name:"Keep my guess and try it",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Run",exact:true})).toBeVisible();
  const run=page.getByRole("button",{name:"Try it",exact:true});
  if(track==="java"){assert(await run.isDisabled());assert((await page.locator(".learning-step").first().innerText()).includes("not runnable in this browser"));}
  else{await run.click();await page.getByText("Prediction matched.",{exact:false}).waitFor({timeout:120000});}
  await page.getByRole("button",{name:"3. Investigate",exact:true}).click();
  await page.getByRole("button",{name:"Next trace step",exact:true}).click();
  await page.getByRole("textbox",{name:"How many lines does this program print?",exact:true}).fill("1");
  await page.getByRole("button",{name:"Check trace",exact:true}).click();await page.getByText("Matched.",{exact:false}).waitFor();
  await page.getByRole("button",{name:"4. Modify",exact:true}).click();
  const program=page.getByRole("textbox",{name:"Your program",exact:true});await program.fill((await program.inputValue()).replace('"Ready"','"Open"'));
  await page.getByRole("button",{name:"Very sure",exact:true}).click();
  if(track!=="java"){await page.getByRole("button",{name:"Check my change",exact:true}).click();await page.getByRole("textbox",{name:"Explain to Tik (optional)",exact:true}).waitFor({timeout:120000});}
  await page.getByRole("button",{name:"6. Recall",exact:true}).click();
  const card=page.locator(".learning-recall").first();await card.getByRole("radio",{name:"Ready",exact:true}).check();await card.getByRole("button",{name:"Check recall",exact:true}).click();await card.getByRole("button",{name:"Good",exact:true}).click();
  assert((await card.innerText()).includes("Demo rating complete"));
  await page.getByRole("button",{name:"7. Recap",exact:true}).click();await page.getByRole("button",{name:"Finish lesson",exact:true}).click();
  await page.getByText("Preview complete. No learning records were changed.",{exact:true}).waitFor();
  const parsons=page.getByRole("region",{name:"Arrange the program",exact:true});
  // Java has three structural blocks; non-Java samples have two print blocks.
  const down=parsons.getByRole("button",{name:"Move block 1 down",exact:true});await down.focus();await page.keyboard.press("Enter");
  if(track!=="java"){await parsons.getByRole("button",{name:"Check arrangement",exact:true}).click();await parsons.getByText("Your arrangement passes the tests.",{exact:false}).waitFor({timeout:120000});}
  const checkpoint=page.getByRole("region",{name:"Close the Book checkpoint",exact:true});
  for(const option of ["Ready","No","1","Inside the quotes","Run the changed program"])await checkpoint.getByRole("radio",{name:option,exact:true}).check();
  await checkpoint.getByRole("button",{name:"Check recall",exact:true}).click();await expect(checkpoint).toContainText("5 of 5 recalled.");
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  await page.screenshot({path:`artifacts/learning-engine/${track}-${theme}-360.png`});
  report.push({track,theme,interactions:"passed",consoleErrors:errors});await page.close();
 }
}finally{await browser.close();fs.writeFileSync("artifacts/learning-engine/browser.json",JSON.stringify(report,null,2)+"\n");}
console.log(JSON.stringify(report));
