# SEO + AEO + GEO Optimization Pass (Autonomous Progress)

**Updated:** 2026-10-17  
**Active Goal:** Make Iwons (https://iwons.vercel.app/) fully crawlable and indexable by search engines and AI answer engines, then improve its search visibility with technical SEO, structured data, and answer-ready content.

---

## Phase Tracking

| Phase | Description | Status | Details |
| --- | --- | --- | --- |
| **Phase S0** | Baseline Audit (Crawlability & Indexability) | **Done** | `docs/SEO_AUDIT.md` completed. Baseline inventory of 645 public pages, live cURL audits with 5 bot user-agents (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot), identified missing 67 visualizer slug URLs from sitemap, client-only visualizer SSR shells (0 H1s), 12 `noindex` blocks, redirect edge cases, and missing structured data. |
| **Phase S1** | Allow Crawling & Indexing | **In Progress** | Set permissive root robots metadata, update `robots.ts` with explicit allows for search & AI answer bots, remove unwanted `noindex`/`nofollow` blocks, and ensure SSR content on visualizer slug pages. |
| **Phase S2** | Sitemap, Canonicals, Metadata & Headings | **Pending** | Update `src/app/sitemap.ts` to include all 67 visualizer slugs with real `lastModified`, ensure absolute trailing-slash canonicals, single `h1` per page, fix duplicate titles and missing descriptions, complete OG/Twitter tags, fix Vercel redirects. |
| **Phase S3** | Structured Data (JSON-LD) | **Pending** | Add server-rendered, Schema.org-valid JSON-LD: `WebSite`, `Person` (Snowi), `CollectionPage`/`ItemList`, `BreadcrumbList`, `LearningResource`, `AboutPage`. |
| **Phase S4** | AEO & GEO Optimization | **Pending** | Answer-first summaries (40-60 words), question-style headings, entity clarity, `public/llms.txt`, internal linking. |
| **Phase S5** | Performance & Crawl Efficiency | **Pending** | Verify Core Web Vitals, image alts/dimensions, mobile layout parity. |
| **Phase S6** | Tooling & Monitoring Guides | **Pending** | Add Bing verification env support, create `scripts/seo-check.mjs` (`npm run seo:check`), write `docs/SEO_NEXT_STEPS.md`. |
| **Phase S7** | Senior QA Verification & Final Report | **Pending** | Full suite execution: `npm run seo:check`, `npm run build`, `npm run lint`, `npm test`, Playwright E2E checks, generate `docs/SEO_REPORT.md`. |

---

## Current System Health & Status
- **Audit Findings:** Logged in `docs/SEO_AUDIT.md`.
- **Decisions Log:** Updated in `docs/DECISIONS.md`.
- **Verification:** Google Search Console verification tag live on `https://iwons.vercel.app/`.

NEXT ACTION: Execute Phase S1 (allow crawling & indexing across root layout, robots.ts, remove unjustified noindex blocks, and implement SSR content on visualizer slugs).
