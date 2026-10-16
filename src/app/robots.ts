import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/settings/",
        "/dashboard/",
        "/progress/",
        "/review/",
        "/submissions/",
        "/contest/",
        "/lists/",
        "/problems/new/",
        "/problems/custom/",
        "/design/",
        "/problem-data/",


        "/dev/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
