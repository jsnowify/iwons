import type { FoundationsManifest, FoundationsProgress } from "./types";
export function foundationsRewards(manifest: FoundationsManifest, progress: FoundationsProgress) {
  const modules = manifest.modules.filter(module =>
    module.lessonIds.length > 0 && module.exerciseIds.length > 0 &&
    module.lessonIds.every(id => progress.lessonsRead[id]) &&
    module.exerciseIds.every(id => progress.exercisesSolved[id]) &&
    progress.checkpointScores[module.checkpointId]?.total === 5,
  ).map(module => module.id);
  const completed = new Set(modules);
  return {
    xp: manifest.exercises.reduce((sum, exercise) => sum + (progress.exercisesSolved[exercise.id] ? exercise.xp : 0), 0),
    moduleStamps: modules,
    courseStamps: manifest.courses.filter(course => course.moduleIds.length > 0 && course.moduleIds.every(id => completed.has(id))).map(course => course.id),
  };
}
