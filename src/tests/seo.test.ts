import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { siteUrl } from "@/lib/site-url";
import { legacyRedirect } from "../../scripts/legacy-redirects.mjs";
import { ALGORITHM_REGISTRY } from "@/visualizer/registry";
import legacyProblems from "@/data/legacy-problems.json";

describe("SEO & Technical Crawlability Invariants", () => {
  it("anchors siteUrl to production domain without trailing slash", () => {
    expect(siteUrl).toBe("https://iwons.vercel.app");
    expect(siteUrl.endsWith("/")).toBe(false);
  });

  it("generates a comprehensive sitemap covering all indexable routes with trailing slashes", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(640);

    const urls = new Set(entries.map((e) => e.url));

    // Core routes
    expect(urls.has("https://iwons.vercel.app/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/path/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/problems/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/visualizer/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/about/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/plans/")).toBe(true);
    expect(urls.has("https://iwons.vercel.app/dashboard/")).toBe(true);

    // All 9 levels
    for (let i = 0; i < 9; i++) {
      expect(urls.has(`https://iwons.vercel.app/path/${i}/`)).toBe(true);
    }

    // All 67 visualizer slug routes
    for (const algo of ALGORITHM_REGISTRY) {
      expect(urls.has(`https://iwons.vercel.app/visualizer/${algo.id}/`)).toBe(true);
    }

    // Every sitemap entry must use production domain and trailing slash
    for (const entry of entries) {
      expect(entry.url.startsWith("https://iwons.vercel.app")).toBe(true);
      expect(entry.url.endsWith("/")).toBe(true);
      expect(entry.lastModified).toBeInstanceOf(Date);
    }

    // Never index retired legacy problems
    for (const lp of legacyProblems) {
      expect(urls.has(`https://iwons.vercel.app/problems/${lp.slug}/`)).toBe(false);
    }
  });

  it("configures permissive robots.txt for search engines and AI answer engines", () => {
    const config = robots();
    expect(Array.isArray(config.rules)).toBe(true);

    const rules = config.rules as Array<{
      userAgent: string | string[];
      allow?: string | string[];
      disallow?: string | string[];
    }>;

    // Check wildcard rule
    const wildcard = rules.find((r) => r.userAgent === "*");
    expect(wildcard).toBeDefined();
    expect(wildcard?.allow).toBe("/");
    expect(wildcard?.disallow).toEqual(["/problem-data/", "/dev/", "/api/"]);

    // Check AI agents rule
    const aiRule = rules.find((r) =>
      Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot")
    );
    expect(aiRule).toBeDefined();
    expect(aiRule?.allow).toBe("/");

    // Sitemap link must point to production
    expect(config.sitemap).toBe("https://iwons.vercel.app/sitemap.xml");
  });

  it("handles legacy redirects cleanly with trailing slashes", () => {
    expect(legacyRedirect("/learn")).toBe("/");
    expect(legacyRedirect("/learn/")).toBe("/");
    expect(legacyRedirect("/learn/path/")).toBe("/");
    expect(legacyRedirect("/tl/problems/")).toBe("/problems/");
    expect(legacyRedirect("/ceb/path/0/")).toBe("/path/0/");
    expect(legacyRedirect("/og/home/")).toBe("/og/home.png");
  });
});

