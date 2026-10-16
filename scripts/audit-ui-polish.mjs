import {chromium} from '@playwright/test';
import fs from 'node:fs';
const axe=process.argv[2];
if(!axe||!fs.existsSync(axe))throw new Error('Pass the existing axe.min.js path.');
const browser=await chromium.launch();const report=[];
fs.mkdirSync('artifacts/ui-polish',{recursive:true});
try{
 for(const theme of ['light','dark'])for(const width of [360,768,1280,1920]){
  const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [name,path]of [['landing','/'],['problems','/problems/'],['learn','/learn/typescript/computer-programming-1/']]){
   await page.goto('http://127.0.0.1:4174'+path);await page.locator('main h1').first().waitFor();const toggle=page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true});if(await toggle.count())await toggle.click();await page.waitForFunction(value=>document.documentElement.dataset.theme===value,theme);
   if(name==='landing')await page.locator('.learn-entry-keys').scrollIntoViewIfNeeded();
   await page.addScriptTag({path:axe});
   const result=await page.evaluate(async()=>({overflow:document.documentElement.scrollWidth>innerWidth,violations:(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))}));
   await page.screenshot({path:`artifacts/ui-polish/${name}-${theme}-${width}.png`});report.push({name,theme,width,...result,errors:[...errors]});
   if(name==='problems' && width<768){await page.getByRole('button',{name:/Filters and order/}).click();const expanded=await page.evaluate(async()=>({overflow:document.documentElement.scrollWidth>innerWidth,violations:(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))}));await page.screenshot({path:`artifacts/ui-polish/problems-filters-${theme}-${width}.png`});report.push({name:'expanded filters',theme,width,...expanded,errors:[...errors]});}
  }
  await context.close();
 }
 fs.writeFileSync('artifacts/ui-polish/a11y.json',JSON.stringify(report,null,2));console.log(JSON.stringify({scans:report.length,violations:report.reduce((sum,row)=>sum+row.violations.length,0),overflows:report.filter(row=>row.overflow).length,pageErrors:report.reduce((sum,row)=>sum+row.errors.length,0)}));if(report.some(row=>row.violations.length||row.overflow||row.errors.length))process.exitCode=1;
}finally{await browser.close();}
