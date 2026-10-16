import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
const manifest=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8"));
for(const p of manifest) {
  const html=fs.readFileSync(`out/problems/${p.slug}/index.html`,"utf8");
  assert(!html.includes("hiddenCases")&&!html.includes("referenceSolutions"),`Private data in initial HTML: ${p.slug}`);
  const pack=JSON.parse(fs.readFileSync(`out/problem-data/${p.slug}.json`,"utf8"));
  assert(pack.hiddenCases.length>=6&&pack.editorialMd.length>0,`Missing lazy pack: ${p.slug}`);
  const image=fs.readFileSync(`out/og/${p.slug}`);
  assert.equal(image.subarray(1,4).toString(),"PNG",`Missing social image: ${p.slug}`);
  assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
}
const retired=JSON.parse(fs.readFileSync("src/data/legacy-problems.json","utf8"));
const sitemap=fs.readFileSync("out/sitemap.xml","utf8");
const learning=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8"));
const courseSlugs={cp1:"computer-programming-1",cp2:"computer-programming-2",dsa:"data-structures-and-algorithms"};
let learningExercises=0,learningLessons=0;
for(const course of learning.courses)for(const station of course.modules){
 if(station.status!=="ready")continue;
 const directory=path.join("src/data/learn",course.id,station.slug);
 const index=JSON.parse(fs.readFileSync(path.join(directory,"module.json"),"utf8"));
 for(const file of index.exerciseFiles){
  const exercise=JSON.parse(fs.readFileSync(path.join(directory,file),"utf8"));
  const html=fs.readFileSync(`out/problems/${exercise.slug}/index.html`,"utf8");
  for(const field of ["hiddenCases","referenceSolution","correctOptionId","correctAnswer"])assert(!html.includes(field),`Private field in learning exercise HTML: ${exercise.slug}/${field}`);
  assert(html.includes('aria-label="Exercise statement"'),`Missing server-rendered exercise statement: ${exercise.slug}`);
  const pack=JSON.parse(fs.readFileSync(`out/learn-data/exercise-${exercise.id}.json`,"utf8"));assert.equal(pack.exerciseId,exercise.id);
  const image=fs.readFileSync(`out/og/${exercise.slug}`);assert.equal(image.subarray(1,4).toString(),"PNG");assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
  assert(sitemap.includes(`/problems/${exercise.slug}/`));learningExercises++;
 }
 for(const lesson of station.lessons)for(const track of Object.keys(lesson.availability)){
  if(lesson.availability[track]!=="ready")continue;
  const url=`/learn/${track}/${courseSlugs[course.id]}/${station.slug}/${lesson.slug}/`;
  const html=fs.readFileSync(`out${url}index.html`,"utf8");
  for(const field of ["expectedOutput","referenceSolution","hiddenCases","correctOptionId"])assert(!html.includes(field),`Private field in lesson HTML: ${url}/${field}`);
  assert(sitemap.includes(url));learningLessons++;
 }
}
for(const {slug} of retired) {
  const html=fs.readFileSync(`out/problems/${slug}/index.html`,"utf8");
  assert(html.includes("noindex")&&html.includes('href="/path/"'),`Retired URL needs a friendly, noindex Path link: ${slug}`);
  assert(!sitemap.includes(`/problems/${slug}/`),`Retired URL in sitemap: ${slug}`);
}
const serviceWorker=fs.readFileSync("out/sw.js","utf8");
const precache=JSON.parse(serviceWorker.match(/const PRECACHE=(\[[^;]+\]);/)[1]);
const chunkDirectory="out/_next/static/chunks";
for(const file of fs.readdirSync(chunkDirectory).filter(file=>file.endsWith(".js"))) {
  const source=fs.readFileSync(`${chunkDirectory}/${file}`,"utf8");
  if(source.includes("path3-500")&&source.includes("prerequisites"))
    assert(!precache.includes(`/_next/static/chunks/${file}`),"Offline installation must not eagerly fetch the full catalog.");
}
console.log(`Static export: ${manifest.length} problem pages, lazy packs and social images verified; ${retired.length} retired URLs explain the move; private data stays out of initial HTML.`);
console.log(`Learning export: ${learningLessons} lesson-track pages and ${learningExercises} exercises verified, with lazy checks and social images.`);
