import { lessonLanguages, type LessonLanguage, type Translated } from "./types";
export const lessonLanguageNames: Record<LessonLanguage, string> = { en: "English", fil: "Tagalog", ceb: "Bisaya" };
export function isLessonLanguage(value: unknown): value is LessonLanguage {
  return typeof value === "string" && lessonLanguages.includes(value as LessonLanguage);
}
export function translated<T>(source: Translated<T>, language: LessonLanguage) {
  const content = source.translations[language];
  const missing = content == null;
  return {
    content: content ?? source.translations.en,
    language: missing ? "en" as const : language,
    missing,
    status: source.translationStatus[missing ? "en" : language],
  };
}
export function learningUrl(language: LessonLanguage, ...segments: string[]) {
  const prefix = language === "fil" ? "/tl" : language === "ceb" ? "/ceb" : "";
  return `${prefix}/learn/${segments.map(segment => encodeURIComponent(segment)).join("/")}${segments.length ? "/" : ""}`;
}
