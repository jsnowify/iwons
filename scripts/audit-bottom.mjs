import {chromium} from '@playwright/test';import fs from 'node:fs';
const phase=process.argv[2]||'before';fs.mkdirSync('artifacts/bottom-layout',{recursive:true});
const browser=await chromium.launch();const context=await browser.newContext({serviceWorkers:'block'});const results=[];
for(const width of [360,390,768,1024,1440])for(const theme of ['light','dark']){
 const page=await context.newPage();await page.setViewportSize({width,height:900});
 for(const route of ['/','/path/','/path/0/','/path/0/#receipt-arithmetic','/problems/receipt-arithmetic-proof-strip/','/progress/','/settings/','/about/']){
  await page.goto('http://127.0.0.1:4174'+route);await page.locator('main').waitFor();await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.scrollTo(0,document.documentElement.scrollHeight)},theme);await page.waitForTimeout(50);
  results.push({width,theme,route,...await page.evaluate(()=>{const footer=document.querySelector('footer'),r=footer?.getBoundingClientRect(),nav=document.querySelector('.mobile-nav')?.getBoundingClientRect();return {footers:document.querySelectorAll('footer').length,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,footerBottom:r?.bottom??null,footerTop:r?.top??null,mobileNavTop:nav?.top??null,documentHeight:document.documentElement.scrollHeight}})});
  if(width===360&&theme==='light'&&['/','/about/','/problems/receipt-arithmetic-proof-strip/'].includes(route))await page.screenshot({path:`artifacts/bottom-layout/${phase}-${route==='/'?'home':route.includes('problems')?'problem':'about'}.png`});
 }
 await page.close();
}
await browser.close();fs.writeFileSync(`artifacts/bottom-layout/${phase}.json`,JSON.stringify(results,null,2));console.log(`${results.length} bottom-layout observations saved (${phase}).`);
