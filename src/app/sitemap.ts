import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { problems, topics, topicSlug } from "@/lib/catalog";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl;
  return [
    "",
    "problems/",
    "plans/",
    "path/",
    ...Array.from({length:9},(_,i)=>`path/${i}/`),
    "about/",
    "visualizer/",
    ...problems.map((p) => `problems/${p.slug}/`),
    ...topics.map((t) => `topics/${topicSlug(t)}/`),
  ].map((path) => ({
    url: `${url}/${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path === "problems/" ? 0.9 : 0.7,
  }));
}
