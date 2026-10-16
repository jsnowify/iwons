import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { Worker } from "node:worker_threads";
import { transform } from "sucrase";
import ts from "typescript";
type Case = {id:string;input:unknown[];expected:unknown;coverage:string};
type Entry = {id:string;slug:string;title:string;unit:string;level:number;order:number;prerequisites:string[]};
type Full = Entry & {descriptionMd:string;constraints:string[];hints:string[];functionName:string;mode:string;cases:Case[];starterCode:Record<string,string>;referenceSolutions:Record<string,string>;privateData:{hiddenCases:Case[];editorialMd:string};complexity:{time:string;space:string}};
const root=path.resolve("."),manifest=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8")) as Entry[];
const languages=["javascript","typescript","python","java"];
const forbidden=fs.readFileSync("scripts/blocklist.txt","utf8").split(/\r?\n/).filter(x=>x&&!x.startsWith("#"));
export async function validateUnit(unit:string) {
  const selected=manifest.filter(p=>p.unit===unit);
  assert(selected.length>=5&&selected.length<=10,"Unit must contain 5–10 problems");
  for(const key of ["id","slug","title"] as const)assert.equal(new Set(manifest.map(p=>p[key].toLowerCase())).size,500,`Duplicate ${key}`);
  const ids=new Map(manifest.map(p=>[p.id,p]));
  for(const p of manifest)for(const prerequisite of p.prerequisites)assert(ids.has(prerequisite)&&ids.get(prerequisite)!.order<p.order&&ids.get(prerequisite)!.level<=p.level,`Invalid prerequisite in ${p.slug}`);
  const problems=selected.map(p=>JSON.parse(fs.readFileSync(`src/data/problems/level-${p.level}/${p.unit}/${p.slug}.json`,"utf8")) as Full);
  const refs=problems.map(p=>({slug:p.slug,js:p.referenceSolutions.javascript,typescript:p.referenceSolutions.typescript,python:p.referenceSolutions.python,java:p.referenceSolutions.java,cases:[...p.cases,...p.privateData.hiddenCases],problem:p}));
  for(const p of problems) {
    assert(p.descriptionMd.length>150&&p.constraints.length>=3&&p.hints.length===3&&new Set(p.hints).size===3,`${p.slug}: incomplete statement`);
    assert.equal(p.cases.length,3);assert(p.privateData.hiddenCases.length>=6);
    assert(p.cases.slice(0,2).every(c=>(c as Case & {explanation?:string}).explanation),"Missing worked explanations");
    for(const language of languages)assert(p.starterCode[language]?.includes(p.functionName)&&p.referenceSolutions[language]?.includes(p.functionName),`Missing ${language} code`);
    assert(p.complexity.time.startsWith("O(")&&p.complexity.space.startsWith("O("));
    const coverage=p.privateData.hiddenCases.map(c=>c.coverage);
    for(const edge of ["singleton","duplicates-or-redundancy","lower-bound","maximum-size","zero-or-minimum","order-and-ties"])assert(coverage.includes(edge),`${p.slug}: missing ${edge}`);
    const cases=[...p.cases,...p.privateData.hiddenCases];assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
    for(const c of cases)assert(Array.isArray(c.input)&&Object.hasOwn(c,"expected"));
    const prose=[p.title,p.descriptionMd,...p.hints,p.privateData.editorialMd].join("\n").toLowerCase();
    for(const phrase of forbidden)assert(!prose.includes(phrase),`${p.slug}: blocked phrase ${phrase}`);
  }
  const dir=path.join(root,"artifacts/curriculum-validation",unit);fs.mkdirSync(dir,{recursive:true});
  for(const name of ["compare","nodes"])fs.writeFileSync(path.join(dir,`${name}.mjs`),transform(fs.readFileSync(`src/lib/harness/${name}.ts`,"utf8"),{transforms:["typescript"]}).code);
  fs.writeFileSync(path.join(dir,"worker.mjs"),transform(fs.readFileSync("src/lib/runners/js.worker.ts","utf8").replace("@/lib/harness/compare","./compare.mjs").replace("@/lib/harness/nodes","./nodes.mjs"),{transforms:["typescript"]}).code);
  fs.writeFileSync(path.join(dir,"bridge.mjs"),"import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:m=>parentPort.postMessage(m)};await import('./worker.mjs');parentPort.on('message',data=>self.onmessage({data}));");
  const worker=new Worker(path.join(dir,"bridge.mjs"));
  try {
    for(const ref of refs)for(const language of ["javascript","typescript"]) {
      const response=await new Promise<{verdict:string;cases:unknown[];compileError?:unknown}>((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error(`Worker timeout ${ref.slug}`)),10000);
        worker.once("message",result=>{clearTimeout(timer);resolve(result);});
        worker.once("error",error=>{clearTimeout(timer);reject(error);});
        worker.postMessage({...ref.problem,code:language==="javascript"?ref.js:ref.typescript,cases:ref.cases,language});
      });
      assert.equal(response.verdict,"accepted",`${ref.slug} ${language}: ${JSON.stringify(response)}`);assert.equal(response.cases.length,ref.cases.length);
      worker.removeAllListeners("error");
    }
  } finally {await worker.terminate();}
  const source=refs.map(r=>r.typescript.replace(/^type (ListNode|TreeNode) = .*;\n/gm,"")).join("\n");
  fs.writeFileSync(path.join(dir,"references.ts"),"type ListNode={val:number;next:ListNode|null};type TreeNode={val:number;left:TreeNode|null;right:TreeNode|null};\n"+source);
  const program=ts.createProgram([path.join(dir,"references.ts")],{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,types:[]});
  const diagnostics=ts.getPreEmitDiagnostics(program);assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}));
  const python=spawnSync("python",["scripts/test-python.py"],{input:JSON.stringify(refs),encoding:"utf8",maxBuffer:20*1024*1024,timeout:30000});
  assert.equal(python.status,0,python.stderr);
  const answers=JSON.parse(python.stdout);
  for(const [i,response]of answers.entries()){assert.equal(response.verdict,"accepted",`${refs[i].slug}: ${JSON.stringify(response)}`);for(const c of response.cases)assert.deepEqual(c.actual,c.expected,`${refs[i].slug} Python case ${c.id}`);}
  const harness=fs.readFileSync("public/runners/JavaHarness.txt","utf8"),javaFiles=[];
  for(const [i,ref]of refs.entries()) {
    const sub=path.join(dir,`p${i}`);fs.mkdirSync(sub,{recursive:true});
    const code=`package p${i};\n`+harness.replace("/* IWONS_USER_CODE */",()=>ref.java).replace('Class.forName("Solution")',`Class.forName("p${i}.Solution")`);
    const file=path.join(sub,"Main.java");fs.writeFileSync(file,code);javaFiles.push(file);
  }
  const compiled=spawnSync("javac",["-d",dir,...javaFiles],{encoding:"utf8",timeout:30000});assert.equal(compiled.status,0,compiled.stderr);
  for(const [i,ref]of refs.entries()) {
    const run=spawnSync("java",["-cp",dir,`p${i}.Main`],{input:JSON.stringify({...ref.problem,cases:ref.cases}),encoding:"utf8",timeout:10000,maxBuffer:5*1024*1024});assert.equal(run.status,0,run.stderr);
    const response=JSON.parse(run.stdout);assert.equal(response.verdict,"accepted",`${ref.slug}: ${run.stdout}`);for(const c of response.cases)assert.deepEqual(c.actual,c.expected,`${ref.slug} Java case ${c.id}`);
  }
  const report={unit,problems:problems.length,cases:refs.reduce((n,r)=>n+r.cases.length,0),checks:["schema","unique titles and slugs","backward prerequisites","blocklist","hidden boundaries","actual JS worker","actual TS worker","strict TS signatures","exact Python harness","native Java harness"],status:"passed",samples:[problems[0],problems[Math.floor(problems.length/2)],problems.at(-1)!].map(p=>({title:p.title,statement:p.descriptionMd}))};
  fs.mkdirSync("docs/curriculum-reports",{recursive:true});fs.writeFileSync(`docs/curriculum-reports/${unit}.json`,JSON.stringify(report,null,2)+"\n");
  console.log(`${unit}: ${problems.length} problems / ${report.cases} cases; JS, TS, Python and Java passed.`);
  return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve("scripts/validate-problems.ts")) {
  const chosen=process.argv[2];
  for(const unit of chosen?[chosen]:[...new Set(manifest.map(p=>p.unit))])await validateUnit(unit);
}
