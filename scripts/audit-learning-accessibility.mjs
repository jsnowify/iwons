import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser=await chromium.launch();
const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
const axe="C:/Users/joshu/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js";
const report=[];
try{
 for(const theme of ["light","dark"])for(const width of [360,768,1280])for(const route of ["/learn/javascript/computer-programming-1/meet-the-language/","/learn/javascript/computer-programming-1/meet-the-language/the-first-message/","/problems/write-a-welcome-slip/","/problems/arrange-two-desk-lines/"]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(base+route);await page.locator("h1").waitFor();
  const themeButton=page.getByRole("button",{name:`Switch to ${theme} theme`,exact:true});if(await themeButton.count())await themeButton.click();
  if(route.includes("/problems/"))await page.locator(".monaco-editor, .learning-parsons").waitFor();
  await page.addScriptTag({path:axe});
  const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>node.target)})));
  assert.deepEqual(violations,[],JSON.stringify({theme,width,route,violations}));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${route}, ${width}`);
  if(width===1280){await page.setViewportSize({width:640,height:450});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at effective 200% viewport: ${route}`);}
  assert.deepEqual(errors,[]);
  report.push({theme,width,route,violations,effectiveZoom200:width===1280});await page.close();
 }
}finally{await browser.close();fs.mkdirSync("artifacts/learning-engine",{recursive:true});fs.writeFileSync("artifacts/learning-engine/accessibility.json",JSON.stringify(report,null,2)+"\n");}
console.log(`Learning accessibility: ${report.length} page/theme/width scans passed; 1280px routes also checked at the effective 200% zoom viewport.`);
