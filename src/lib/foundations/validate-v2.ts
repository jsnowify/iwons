import { tracks, type LearnManifest } from "./model-v2.ts";
export function validateLearnManifest(value:unknown,units:string[]):string[] {
  const errors:string[]=[];
  const record=(entry:unknown):entry is Record<string,unknown> => !!entry&&typeof entry==="object"&&!Array.isArray(entry);
  if(!record(value)||value.schemaVersion!==2||!Array.isArray(value.courses))return ["Invalid Learn manifest schema."];
  const manifest=value as unknown as LearnManifest;
  const ids=new Set<string>();const validStatus=(status:unknown)=>["planned","draft","ready"].includes(String(status));
  function unique(id:string){if(!id||ids.has(id))errors.push(`Duplicate or missing ID: ${id}`);ids.add(id);}
  const names=manifest.courses.map(course=>course.id).sort().join();if(names!=="cp1,cp2,dsa")errors.push("Expected CP1, CP2 and DSA courses.");
  for(const course of manifest.courses){unique(course.id);if(!Array.isArray(course.modules)||!course.modules.length){errors.push(`No modules: ${course.id}`);continue;}
    const slugs=new Set<string>();const introduced=Object.fromEntries(tracks.map(track=>[track,new Set<string>()])) as Record<typeof tracks[number],Set<string>>;
    for(const entry of course.modules){unique(entry.id);if(!entry.slug||slugs.has(entry.slug))errors.push(`Duplicate module slug: ${entry.slug}`);slugs.add(entry.slug);if(!validStatus(entry.status))errors.push(`Invalid module status: ${entry.id}`);
      if(!Array.isArray(entry.practiceUnits)||entry.practiceUnits.some(unit=>!units.includes(unit)))errors.push(`Unknown Path practice unit: ${entry.id}`);
      if(!Array.isArray(entry.lessons)||entry.lessons.length<3||entry.lessons.length>6){errors.push(`Expected 3–6 lessons: ${entry.id}`);continue;}
      const lessonSlugs=new Set<string>();
      for(const lesson of entry.lessons){unique(lesson.id);if(!lesson.slug||lessonSlugs.has(lesson.slug))errors.push(`Duplicate lesson slug: ${lesson.slug}`);lessonSlugs.add(lesson.slug);if(!validStatus(lesson.status))errors.push(`Invalid lesson status: ${lesson.id}`);
        if(!lesson.languages?.includes("en")||lesson.languages.some(language=>!["en","fil","ceb"].includes(language)))errors.push(`Invalid human languages: ${lesson.id}`);
        for(const track of tracks){if(!validStatus(entry.availability?.[track])||!validStatus(lesson.availability?.[track]))errors.push(`Missing track status: ${lesson.id}/${track}`);
          if(lesson.availability?.[track]==="ready"){
            const variant=lesson.variants?.[track];if(lesson.status!=="ready"||!variant?.contentFile||!Array.isArray(variant.concepts)||!record(variant.introducedIn)){errors.push(`Ready lesson missing content: ${lesson.id}/${track}`);continue;}
            for(const concept of variant.concepts)if(!introduced[track].has(concept)&&variant.introducedIn[concept]!==lesson.id)errors.push(`Concept not introduced: ${lesson.id}/${track}/${concept}`);
            for(const [concept,id]of Object.entries(variant.introducedIn)){if(id!==lesson.id||introduced[track].has(concept))errors.push(`Invalid concept introduction: ${lesson.id}/${track}/${concept}`);introduced[track].add(concept);}
          }
        }
      }
    }
  }
  return errors;
}
