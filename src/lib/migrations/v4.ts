import { emptyFoundationsProgress } from "../legacy-learning";
import { isStoredLanguagePreference } from "../legacy-learning";
import { validateFoundationsProgress } from "../legacy-learning";
export function migrateV3Data(data: Record<string, unknown>): Record<string, unknown> {
  const settings = data.settings as Record<string, unknown> | undefined;
  if (data.foundations !== undefined) validateFoundationsProgress(data.foundations);
  // This edition adds a track. It must never retire or reset active Path data.
  return {
    ...data,
    ...(settings ? { settings: { ...settings, lessonLanguage: isStoredLanguagePreference(settings.lessonLanguage) ? settings.lessonLanguage : "en" } } : {}),
    foundations: data.foundations ?? emptyFoundationsProgress(),
    schemaVersion: 4,
  };
}
