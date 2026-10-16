import { emptyLearnProgress, isTrack } from "../foundations/model-v2";
import { validateFoundationsProgress } from "../foundations/validate-progress";
export function migrateV4Data(data:Record<string,unknown>):Record<string,unknown> {
  const foundations = emptyLearnProgress();
  if (data.foundations !== undefined) {
    validateFoundationsProgress(data.foundations);
    foundations.java = data.foundations as typeof foundations.java;
  }
  const settings = data.settings as Record<string,unknown> | undefined;
  return {...data, foundations, schemaVersion:5, ...(settings ? {settings:{...settings,codeTrack:isTrack(settings.codeTrack) ? settings.codeTrack : isTrack(settings.language) ? settings.language : "java"}} : {})};
}
