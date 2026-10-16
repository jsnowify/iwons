import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
if(!process.argv[2])throw new Error('Pass the existing Lighthouse core/index.js path; no dependency is installed.');
const {default:lighthouse}=await import(pathToFileURL(process.argv[2]).href);
const port=9337;
const browser=await chromium.launch({headless:true,args:[`--remote-debugging-port=${port}`]});
try {
 const endpoint=await fetch(`http://127.0.0.1:${port}/json/version`);if(!endpoint.ok)throw new Error('Chromium debugging endpoint did not start.');
 const result=await lighthouse(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4174/learn/',{port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']});
 fs.mkdirSync('artifacts/learn-v2',{recursive:true});fs.writeFileSync('artifacts/learn-v2/lighthouse.json',result.report);
 console.log(JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)]))));
 if(result.lhr.runtimeError)throw new Error(result.lhr.runtimeError.message);
}finally{await browser.close();}
