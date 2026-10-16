import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
const browser=await chromium.launch();
const report=[];
async function edit(page,code){
 await page.locator(".monaco-editor").waitFor();
 await page.evaluate(value=>new Promise(resolve=>window.require(["vs/editor/editor.main"],monaco=>{monaco.editor.getModels()[0].setValue(value);resolve();})),code);
}
try{
 for(const kind of ["program","parsons"])for(const track of ["java","javascript","typescript","python"]){
  const page=await browser.newPage({viewport:{width:360,height:900},reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(`${base}/design/learning/exercises/${kind}/`);
  await page.getByRole("navigation",{name:"Exercise code track"}).getByRole("button",{name:{java:"Java",javascript:"JavaScript",typescript:"TypeScript",python:"Python"}[track],exact:true}).click();
  const beforeLearning=await page.evaluate(()=>localStorage.getItem("iwons:v6:learning"));
  await page.getByRole("button",{name:"Very sure",exact:true}).click();
  const keys=JSON.parse(fs.readFileSync(`public/learn-data/exercise-tool-demo-${kind}.json`,"utf8"));
  if(kind==="program")await edit(page,keys.variants[track].referenceSolution);
  else{
   const order=keys.variants[track].alternativeOrders[0];
   const sample=JSON.parse(fs.readFileSync("src/data/learning-exercises-demo.json","utf8")).find(item=>item.kind===kind);
   for(let target=0;target<order.length;target++){
    const text=sample.variants[track].parsons.blocks.find(block=>block.id===order[target]).code;
    let index=await page.locator(".learning-parsons li").evaluateAll((items,value)=>items.findIndex(item=>item.querySelector("pre").textContent===value),text);
    while(index>target){await page.getByRole("button",{name:`Move block ${index+1} up`,exact:true}).click();index--;await expect(page.locator(".learning-parsons li").nth(index)).toBeFocused();}
   }
  }
  const submit=page.getByRole("button",{name:kind==="program"?"Submit solution":"Check arrangement",exact:true});
  if(track==="java")await expect(submit).toBeDisabled();
  else{
   await submit.click();
   const note=page.getByRole("textbox",{name:"Explain to Tik (optional)",exact:true});await note.waitFor({timeout:120000});
   await note.fill("Output uses values created earlier.");await expect(note).toHaveValue("Output uses values created earlier.");
   assert.equal(await page.evaluate(()=>localStorage.getItem("iwons:v6:learning")),beforeLearning,"Preview must not save learning records");
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  report.push({kind,track,passed:true});await page.close();
 }
}finally{await browser.close();fs.mkdirSync("artifacts/learning-engine",{recursive:true});fs.writeFileSync("artifacts/learning-engine/workspaces.json",JSON.stringify(report,null,2)+"\n");}
console.log(JSON.stringify(report));
