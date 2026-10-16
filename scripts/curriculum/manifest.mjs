import fs from "node:fs";
import { units, levels, projections, modesFor } from "./units.mjs";
const manifest = [];
for (const [unitIndex, unit] of units.entries()) {
  const previousUnit = units[unitIndex - 1];
  const intro = `${unit.idea}. ${unit.definition} Keep the sequence order specified here before computing the requested receipt. A scan invariant says what has been processed and what remains. Work through the proof strip first, then change the returned summary without changing the definition of that sequence. The last card revisits loop accumulators from Hello, Keys${unit.level < 2 ? " (earlier units are used while the first two levels establish the foundations)" : ""}.`;
  unit.intro = intro;
  for (const [index, mode] of modesFor(unit).entries()) {
    const slug = `${unit.slug}-${projections[mode].name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
    const id = `path3-${String(manifest.length + 1).padStart(3,"0")}`;
    const prerequisites = index ? [manifest.at(-1).id] : previousUnit ? [manifest.find(p => p.unit === previousUnit.slug).id] : [];
    if (mode === 9 && unit.level >= 2) prerequisites.push("path3-013");
    manifest.push({ id, slug, title: `${unit.name}: ${projections[mode].name}`, level: unit.level, unit: unit.slug, order: manifest.length + 1, difficulty: levels[unit.level].tier, topics: [levels[unit.level].subtitle, unit.idea], patterns: [unit.idea], prerequisites: [...new Set(prerequisites)], summary: `${unit.definition} ${projections[mode].task}`, stage: mode === 9 ? "Boss · revisit" : ["Warm-up","Variation","Edge-case trap","Combine","Optimize","Boundary variation","Counting variation","Filtered variation","Sequence variation"][index], boss: mode === 9, revisit: mode === 9 ? (unit.level >= 2 ? "Level 0: loop accumulators" : "Earlier foundation work; the first unit establishes the prerequisite") : undefined });
  }
}
if (manifest.length !== 500 || levels.map(l=>l.count).join() !== "30,50,50,55,45,55,55,70,90") throw new Error("Curriculum count mismatch");
fs.writeFileSync("src/data/curriculum.json", JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync("src/data/units.json", JSON.stringify(units, null, 2) + "\n");
console.log(`Manifest ready: ${manifest.length} entries in ${units.length} units.`);
