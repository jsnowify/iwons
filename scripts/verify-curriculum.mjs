import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const manifest=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8"));
const digest=contents=>crypto.createHash("sha256").update(contents).digest("hex");
const files=["src/data/curriculum.json","src/data/catalog.json","src/data/problem-index.json","src/data/level-problems.json","src/data/curriculum-stats.json","scripts/references.json"];
files.push("src/data/topic-foundations.json");
for (const topic of JSON.parse(fs.readFileSync("src/data/topic-foundations.json", "utf8"))) files.push(`public/foundation-data/${topic.id}.json`);
for(const entry of manifest)files.push(`src/data/problems/level-${entry.level}/${entry.unit}/${entry.slug}.json`);
for(const unit of new Set(manifest.map(p=>p.unit))) {
  const file=`docs/curriculum-reports/${unit}.json`,report=JSON.parse(fs.readFileSync(file,"utf8"));
  assert.equal(report.status,"passed");assert.equal(report.problems,manifest.filter(p=>p.unit===unit).length);assert.equal(report.samples.length,3);
  files.push(file);
}
const hashes=Object.fromEntries(files.map(file=>[file,digest(fs.readFileSync(file))]));
if(process.argv.includes("--record"))fs.writeFileSync("src/data/curriculum-integrity.json",JSON.stringify(hashes,null,2)+"\n");
else {
  const recorded=JSON.parse(fs.readFileSync("src/data/curriculum-integrity.json","utf8"));
  const changed=files.filter(file=>hashes[file]!==recorded[file]);
  assert.equal(changed.length,0,`Curriculum changed after validation: ${changed.slice(0,8).join(", ")}. Run npm run seed to validate and republish it.`);
  assert.equal(Object.keys(recorded).length,files.length,"Curriculum file count changed after validation.");
}
assert.equal(manifest.length,500);
assert.deepEqual(Array.from({length:9},(_,level)=>manifest.filter(p=>p.level===level).length),[30,50,50,55,45,55,55,70,90]);
assert.deepEqual(JSON.parse(fs.readFileSync("src/data/problem-index.json","utf8")),manifest.map(({id,slug,title,difficulty})=>({id,slug,title,difficulty})));
assert.deepEqual(JSON.parse(fs.readFileSync("src/data/level-problems.json","utf8")),Array.from({length:9},(_,level)=>manifest.filter(p=>p.level===level).map(p=>p.id)));
assert.deepEqual(JSON.parse(fs.readFileSync("src/data/curriculum-stats.json","utf8")),{problems:500,units:54});
console.log(`Curriculum integrity: 500 problems, 54 passing unit reports, ${files.length} matching file hashes.`);
