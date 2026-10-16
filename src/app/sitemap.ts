import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { problems, topics, topicSlug } from "@/lib/catalog";
import { getLearnExercises } from "@/lib/foundations/lesson-content";
import { courseIdFromSlug } from "@/lib/foundations/model-v2";
import { learnPaths, learnManifest } from "@/lib/foundations/learn";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl;
  return [
    "",
    "problems/",
    "plans/",
    "path/",
    ...learnPaths().filter(segments => segments.length < 3 || learnManifest.courses.find(course => course.id === courseIdFromSlug(segments[1]))?.modules.find(module => module.slug === segments[2])?.status === "ready").map(segments=>`learn/${segments.length ? segments.join("/")+"/" : ""}`),
    ...Array.from({length:9},(_,i)=>`path/${i}/`),
    "about/",
    ...problems.map((p) => `problems/${p.slug}/`),
    ...getLearnExercises().map(entry=>`problems/${entry.exercise.slug}/`),
    ...topics.map((t) => `topics/${topicSlug(t)}/`),
  ].map((path) => ({
    url: `${url}/${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "problems/" ? 0.9 : 0.7,
  }));
}
