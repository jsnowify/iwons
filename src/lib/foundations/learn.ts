import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LearnManifest } from "./model-v2";
import { tracks, courseSlugs } from "./model-v2";
function loadManifest():LearnManifest {
  try {
    const source=JSON.parse(readFileSync(join(process.cwd(),"src/data/foundations.json"),"utf8")) as LearnManifest;
    if(source.schemaVersion!==2 || !Array.isArray(source.courses))throw new Error("Invalid Learn manifest");
    return source;
  } catch { return {schemaVersion:2,courses:[]}; }
}
export const learnManifest = loadManifest();
export function learnPaths() {
  return [[], ...tracks.flatMap(track => [[track], ...learnManifest.courses.flatMap(course => [
    [track,courseSlugs[course.id]], ...course.modules.flatMap(entry => [
      [track,courseSlugs[course.id],entry.slug], ...entry.lessons.filter(lesson => lesson.status === "ready" && lesson.availability[track] === "ready").map(lesson => [track,courseSlugs[course.id],entry.slug,lesson.slug]),
    ]),
  ])])];
}
export function studyModules(levelUnits: string[]) {
  return learnManifest.courses.find(course => course.id === "dsa")?.modules.filter(entry => entry.practiceUnits.some(unit => levelUnits.includes(unit))) ?? [];
}
export function legacyLearnPaths() {
  return learnPaths().filter(path => path.length >= 2).map(path => {
    const id = (Object.keys(courseSlugs) as (keyof typeof courseSlugs)[]).find(id => courseSlugs[id] === path[1])!;
    return [path[0], id, ...path.slice(2)];
  });
}
export function canonicalLearnSegments(segments: string[]) {
  const id = segments[1];
  return id && Object.hasOwn(courseSlugs, id)
    ? [segments[0], courseSlugs[id as keyof typeof courseSlugs], ...segments.slice(2)]
    : segments;
}
