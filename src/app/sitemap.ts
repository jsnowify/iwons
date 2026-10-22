import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { problems, topics, topicSlug } from "@/lib/catalog";
import { ALGORITHM_REGISTRY } from "@/visualizer/registry";
import { foundationLessons } from "@/lib/foundation-track";

export const dynamic = "force-static";

const LAST_MODIFIED = new Date("2026-10-17T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl;
  const paths: string[] = [
    "",
    "problems/",
    "plans/",
    "path/",
    "foundation/",
    ...foundationLessons.map(lesson => `foundation/${lesson.id}/`),
    ...Array.from({ length: 9 }, (_, i) => `path/${i}/`),
    "about/",
    "visualizer/",
    ...ALGORITHM_REGISTRY.map((a) => `visualizer/${a.id}/`),
    ...problems.map((p) => `problems/${p.slug}/`),
    ...topics.map((t) => `topics/${topicSlug(t)}/`),
    "dashboard/",
    "progress/",
    "warm-up/",
    "contest/",
    "review/",
    "lists/",
    "settings/",
    "leaderboard/",
    "submissions/",
    "problems/new/",
  ];

  return paths.map((path) => ({
    url: `${url}/${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "problems/" || path === "path/" ? 0.9 : 0.7,
  }));
}
