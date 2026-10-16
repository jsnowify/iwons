import fs from "node:fs";
import path from "node:path";
import { authorUnit } from "./curriculum/author-unit.mjs";
import { units, levels } from "./curriculum/units.mjs";
import { validateUnit } from "./validate-problems.ts";
if (process.argv.includes("--author-variables-module")) await import("./author-variables-module.mjs");
if (process.argv.includes("--author-first-module")) await import("./author-first-module.mjs");
if (process.argv.includes("--learn-only")) {
  await import("./seed-learn.mjs");
  await import("./seed-learning-demo.mjs");
  process.exit(0);
}
const manifest=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8"));
// Preserve URL aliases, not retired statements or reference code.
const prior=JSON.parse(fs.readFileSync("src/data/catalog.json","utf8"));
const aliases=JSON.parse(fs.readFileSync("src/data/legacy-problems.json","utf8"));
const currentSlugs=new Set(manifest.map(p=>p.slug));
const retired=[...aliases,...prior.filter(p=>!currentSlugs.has(p.slug))];
fs.writeFileSync("src/data/legacy-problems.json",JSON.stringify([...new Set(retired.map(p=>p.slug))].map(slug=>({slug})),null,2)+"\n");
for(const p of retired)for(const file of [`src/data/problems/${p.slug}.json`,`public/problem-data/${p.slug}.json`])if(fs.existsSync(file))fs.unlinkSync(file);
const start=process.argv.includes("--from")?process.argv[process.argv.indexOf("--from")+1]:null;
const startIndex=start?units.findIndex(u=>u.slug===start):0;
if(startIndex<0)throw new Error(`Unknown unit ${start}`);
const only=process.argv.includes("--unit")?process.argv[process.argv.indexOf("--unit")+1]:null;
if(only&&!units.some(u=>u.slug===only))throw new Error(`Unknown unit ${only}`);
for(const unit of only ? units.filter(u=>u.slug===only) : units.slice(startIndex)) {
  authorUnit(unit.slug);
  await validateUnit(unit.slug);
}
const publicCatalog=[],references=[];
fs.mkdirSync("public/problem-data",{recursive:true});
for(const entry of manifest) {
 const p=JSON.parse(fs.readFileSync(`src/data/problems/level-${entry.level}/${entry.unit}/${entry.slug}.json`,"utf8"));
 const {referenceSolutions,privateData,workedExamples,...publicProblem}=p;
 const summary={...entry,overview:p.overview,complexity:p.complexity};
 publicCatalog.push(summary);
 fs.writeFileSync(`public/problem-data/${p.slug}.json`,JSON.stringify(privateData));
 references.push({slug:p.slug,js:referenceSolutions.javascript,typescript:referenceSolutions.typescript,python:referenceSolutions.python,java:referenceSolutions.java,cases:[...p.cases,...privateData.hiddenCases],problem:publicProblem});
}
fs.writeFileSync("src/data/catalog.json",JSON.stringify(publicCatalog));
fs.writeFileSync("src/data/problem-index.json",JSON.stringify(publicCatalog.map(({id,slug,title,difficulty})=>({id,slug,title,difficulty}))));
fs.writeFileSync("src/data/level-problems.json",JSON.stringify(levels.map(level=>publicCatalog.filter(p=>p.level===level.id).map(p=>p.id))));
fs.writeFileSync("src/data/curriculum-stats.json",JSON.stringify({problems:publicCatalog.length,units:units.length}));
fs.writeFileSync("scripts/references.json",JSON.stringify(references));
const intros=JSON.parse(fs.readFileSync("src/data/primers.json","utf8"));
for(const level of levels){level.primer=intros[level.id].primer;level.example=intros[level.id].example;}
fs.writeFileSync("src/data/levels.json",JSON.stringify(levels,null,2)+"\n");
for(const l of levels)fs.writeFileSync(`src/data/levels/${l.id}.json`,JSON.stringify(l,null,2)+"\n");
process.argv.push("--record");
await import("./verify-curriculum.mjs");
console.log(`Published local catalog: ${publicCatalog.length} original problems, ${units.length} validated units.`);

// Learn maps are structure-only until runtime and content gates pass.
await import("./seed-learn.mjs");

await import("./seed-learning-demo.mjs");
