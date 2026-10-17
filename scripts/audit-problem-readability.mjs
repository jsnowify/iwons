import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('src/data/curriculum.json','utf8'));
const baselinePath=process.argv[2];
const baseline=baselinePath?JSON.parse(fs.readFileSync(baselinePath,'utf8')):null;
const required=['Your task\n','Inputs\n','Step 1: Build the result list\n','Step 2: Return the answer\n','Write your function\n'];
const rows=[];let examples=0,cases=0;
for(const entry of manifest){
 const p=JSON.parse(fs.readFileSync(`src/data/problems/level-${entry.level}/${entry.unit}/${entry.slug}.json`,'utf8'));
 for(const heading of required)assert(p.descriptionMd.includes(heading),`${p.slug}: missing ${heading}`);
 assert.equal(p.parameterNames.length,2);assert.equal(p.parameterNames[1],'k');
 assert(p.starterCode.javascript.includes(`(${p.parameterNames.join(', ')})`),`${p.slug}: parameter labels do not match the function`);
 assert(!/derived sequence|inspection-card|scan invariant|qualifying slip|maximal consecutive/i.test([p.descriptionMd,...p.hints,...p.cases.map(c=>c.explanation)].join(' ')),`${p.slug}: old unexplained phrasing`);
 assert(p.constraints.some(c=>c.startsWith('Efficiency goal:')));
 for(const c of p.cases){assert(c.explanation.startsWith('Step 1 gives the result list '));assert(c.explanation.includes('return')||c.explanation.includes('Return'));examples++;}
 const {id,slug,functionName,mode,javaParams,inputKinds,timeLimitMs,complexity,referenceSolutions}=p;
 const testCases=[...p.cases,...p.privateData.hiddenCases].map(({id,input,expected,coverage})=>({id,input,expected,coverage}));cases+=testCases.length;
 const contractHash=createHash('sha256').update(JSON.stringify({id,slug,functionName,mode,javaParams,inputKinds,timeLimitMs,complexity,referenceSolutions,cases:testCases})).digest('hex');
 if(baseline)assert.equal(contractHash,baseline[p.slug],`${p.slug}: execution contract changed`);
 const sentences=p.descriptionMd.split(/(?<=[.!?])\s+/);const maxSentenceWords=Math.max(...sentences.map(sentence=>sentence.trim().split(/\s+/).length));
 rows.push({slug:p.slug,unit:p.unit,level:p.level,maxSentenceWords,contractHash});
}
assert.equal(rows.length,500);assert.equal(new Set(rows.map(row=>row.unit)).size,54);
const report={problems:rows.length,units:54,publicExamples:examples,totalCases:cases,unchangedContracts:baseline?rows.length:null,notes:'Plain-language structure and sentence counts support editorial review; they do not certify an individual reading grade.',rows};
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(baseline?'artifacts/problem-contract-audit.json':'artifacts/problem-readability-audit.json',JSON.stringify(report,null,2));
console.log(`Readability audit: ${rows.length} problems, 54 units, ${examples} named examples, ${cases} test cases${baseline?', all 500 original execution contracts unchanged':''}.`);
