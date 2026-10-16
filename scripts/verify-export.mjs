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
