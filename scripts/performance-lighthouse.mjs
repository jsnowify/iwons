import { chromium } from "@playwright/test";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const {default:lighthouse}=await import(pathToFileURL(process.argv[2]).href);
const phase=process.argv[3]||"before",port=9347;
const browser=await chromium.launch({headless:true,args:[`--remote-debugging-port=${port}`]});
const report=[];
try{
 for(const [name,route]of [["home","/"],["path","/path/"],["level","/path/0/"],["unit","/path/0/#receipt-arithmetic"],["problem","/problems/receipt-arithmetic-proof-strip/"],["progress","/progress/"],["settings","/settings/"]]){
  const result=await lighthouse(`http://127.0.0.1:4174${route}`,{port,output:"json",logLevel:"error",onlyCategories:["performance","accessibility","best-practices","seo"]});
  if(result.lhr.runtimeError)throw new Error(result.lhr.runtimeError.message);
  fs.mkdirSync("artifacts/performance",{recursive:true});fs.writeFileSync(`artifacts/performance/${phase}-${name}-lighthouse.json`,result.report);
  const summary={name,route,scores:Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)])),lcp:result.lhr.audits["largest-contentful-paint"].numericValue,tbt:result.lhr.audits["total-blocking-time"].numericValue,cls:result.lhr.audits["cumulative-layout-shift"].numericValue};report.push(summary);console.log(JSON.stringify(summary));
 }
}finally{await browser.close();fs.writeFileSync(`artifacts/performance/${phase}-lighthouse.json`,JSON.stringify(report,null,2)+"\n");}
