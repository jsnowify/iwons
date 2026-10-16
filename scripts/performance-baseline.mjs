import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
const phase=process.argv[2]||"before";
function bytes(root){return !fs.existsSync(root)?0:fs.readdirSync(root,{withFileTypes:true}).reduce((sum,item)=>{const file=path.join(root,item.name);return sum+(item.isDirectory()?bytes(file):fs.statSync(file).size);},0);}
const spans=fs.readFileSync(".next/trace","utf8").trim().split("\n").flatMap(line=>JSON.parse(line));
const build=spans.filter(span=>span.name==="next-build").at(-1);
const routes=["/","/path/","/path/0/","/problems/receipt-arithmetic-proof-strip/","/progress/","/settings/"];
const bundles=routes.map(route=>{
 const html=fs.readFileSync(path.join("out",route,"index.html"),"utf8");
 const scripts=[...new Set([...html.matchAll(/<script[^>]+src="(\/_next\/[^"?]+)[^"]*"/g)].map(match=>match[1]))];
 return {route,files:scripts.length,raw:scripts.reduce((sum,file)=>sum+fs.statSync(path.join("out",decodeURIComponent(file))).size,0),gzip:scripts.reduce((sum,file)=>sum+gzipSync(fs.readFileSync(path.join("out",decodeURIComponent(file)))).length,0)};
});
const prerender=JSON.parse(fs.readFileSync(".next/prerender-manifest.json","utf8"));
const routeNames=Object.keys(prerender.routes);
const report={phase,measuredAt:new Date().toISOString(),nextBuildSeconds:build.duration/1e6,staticEntries:routeNames.length,nextBytes:bytes(".next"),cacheBytes:bytes(".next/cache"),jsonBytes:Object.fromEntries(["catalog","curriculum"].map(name=>[name,fs.statSync(`src/data/${name}.json`).size])),ogEntries:routeNames.filter(route=>route.startsWith("/og/")).length,learnEntries:routeNames.filter(route=>route.startsWith("/learn")).length,bundles};
fs.mkdirSync("artifacts/performance",{recursive:true});fs.writeFileSync(`artifacts/performance/${phase}.json`,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report));
