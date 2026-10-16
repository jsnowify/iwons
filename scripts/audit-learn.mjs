import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4174';
const axe=process.argv[2];
if(!axe||!fs.existsSync(axe))throw new Error('Pass the existing axe.min.js path; no package will be installed.');
fs.mkdirSync('artifacts/learn-v2',{recursive:true});
const browser=await chromium.launch();const report=[];
try {
 for(const theme of ['light','dark'])for(const width of [1280,768,360]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [name,path]of [['hub','/learn/'],['module','/learn/typescript/computer-programming-1/meet-the-language/'],['visualizers','/learn/visualizers/']]){
   await page.goto(base+path);
   const toggle=page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true});
   if(await toggle.count())await toggle.click();
   await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
   await page.addScriptTag({path:axe});
   const result=await page.evaluate(async()=>({overflow:document.documentElement.scrollWidth>innerWidth,violations:(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))}));
   await page.screenshot({path:`artifacts/learn-v2/${name}-${theme}-${width}.png`,fullPage:true});report.push({name,theme,width,...result,errors:[...errors]});
  }
  await context.close();
 }
 fs.writeFileSync('artifacts/learn-v2/a11y.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({scans:report.length,violations:report.reduce((sum,row)=>sum+row.violations.length,0),overflows:report.filter(row=>row.overflow).length,pageErrors:report.reduce((sum,row)=>sum+row.errors.length,0)}));
 if(report.some(row=>row.violations.length||row.overflow||row.errors.length))process.exitCode=1;
}finally{await browser.close();}
