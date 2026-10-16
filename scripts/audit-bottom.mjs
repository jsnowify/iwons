import {chromium} from '@playwright/test';import fs from 'node:fs';
const phase=process.argv[2]||'before';fs.mkdirSync('artifacts/bottom-layout',{recursive:true});
const browser=await chromium.launch();const context=await browser.newContext({serviceWorkers:'block'});const results=[];
for(const width of [360,390,768,1024,1440])for(const theme of ['light','dark']){
 const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});await page.setViewportSize({width,height:900});
 for(const route of ['/','/path/','/path/0/','/path/0/#receipt-arithmetic','/problems/receipt-arithmetic-proof-strip/','/progress/','/settings/','/about/']){
  errors.length=0;await page.goto('http://127.0.0.1:4174'+route);await page.waitForFunction(()=>document.documentElement.dataset.motion);
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:/Switch to .* theme/}).click();
  await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,document.documentElement.scrollHeight);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  results.push({width,theme,route,errors:[...errors],...await page.evaluate(()=>{const footer=document.querySelector('footer'),r=footer?.getBoundingClientRect(),nav=document.querySelector('.mobile-nav')?.getBoundingClientRect();return {footers:document.querySelectorAll('footer').length,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,footerBottom:r?.bottom??null,footerTop:r?.top??null,mainBottom:document.querySelector("main").getBoundingClientRect().bottom,mobileNavTop:nav?.height?nav.top:null,documentHeight:document.documentElement.scrollHeight}})});
  if(width===360&&theme==='light'&&['/','/about/','/problems/receipt-arithmetic-proof-strip/'].includes(route))await page.screenshot({path:`artifacts/bottom-layout/${phase}-${route==='/'?'home':route.includes('problems')?'problem':'about'}.png`});
 }
 await page.close();
}
await browser.close();fs.writeFileSync(`artifacts/bottom-layout/${phase}.json`,JSON.stringify(results,null,2));console.log(`${results.length} bottom-layout observations saved (${phase}).`);

if(phase!=="before"){const issues=results.filter(row=>row.footers!==1||row.horizontalOverflow||row.errors.length||row.footerTop<row.mainBottom-1||row.footerBottom>901||(row.mobileNavTop!==null&&row.footerBottom>row.mobileNavTop+1));if(issues.length)throw new Error(JSON.stringify(issues));console.log("Zero console/page errors, overflows, missing footers or overlaps.");}
