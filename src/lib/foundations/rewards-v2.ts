import { tracks, type LearnManifest, type LearnProgress } from "./model-v2";
export function learnRewards(manifest:LearnManifest, progress:LearnProgress, exercises:{id:string;xp:number}[], moduleExercises:Record<string,string[]>) {
  const xp = exercises.reduce((sum,exercise)=>{
    const count = tracks.filter(track=>progress[track].exercisesSolved[exercise.id]).length;
    return sum + (count ? exercise.xp * (1 + (count-1)*0.25) : 0);
  },0);
  const stamps = tracks.flatMap(track=>manifest.courses.flatMap(course=>{
    const modules = course.modules.filter(entry=>entry.lessons.length && entry.lessons.every(lesson=>lesson.availability[track]==="ready" && progress[track].lessonsRead[lesson.id]) && (moduleExercises[entry.id]?.length ?? 0)>0 && moduleExercises[entry.id].every(id=>progress[track].exercisesSolved[id]) && progress[track].checkpointScores[entry.id]?.total>=5);
    return [{track,course:course.id,modules:modules.map(entry=>entry.id),complete:modules.length===course.modules.length && course.modules.length>0}];
  }));
  return {xp,stamps,polyglotCourses:manifest.courses.filter(course=>stamps.filter(stamp=>stamp.course===course.id && stamp.complete).length>=2).map(course=>course.id)};
}
