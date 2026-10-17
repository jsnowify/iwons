# SEO + AEO + GEO Optimization Pass (Autonomous Progress)

**Updated:** 2026-10-17  
**Active Goal:** Make Iwons (https://iwons.vercel.app/) fully crawlable and indexable by search engines and AI answer engines, then improve its search visibility with technical SEO, structured data, and answer-ready content.

---

## Phase Tracking

| Phase | Description | Status | Details |
| --- | --- | --- | --- |
| **Phase S0** | Baseline Audit (Crawlability & Indexability) | **Done** | `docs/SEO_AUDIT.md` completed. Baseline inventory of 645 public pages, live cURL audits with 5 bot user-agents (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot), identified missing 67 visualizer slug URLs from sitemap, client-only visualizer SSR shells (0 H1s), 12 `noindex` blocks, redirect edge cases, and missing structured data. |
| **Phase S1** | Allow Crawling & Indexing | **Done** | Set permissive root robots metadata (`index: true, follow: true, googleBot: { ... }`), updated `robots.ts` with explicit allows for search bots and AI answer agents (`GPTBot`, `ClaudeBot`, `PerplexityBot`), removed 12 unjustified `noindex`/`nofollow` blocks, and implemented SSR top bar content on visualizer slug pages. |
| **Phase S2** | Sitemap, Canonicals, Metadata & Headings | **Done** | Updated `src/app/sitemap.ts` to include all 67 visualizer slugs with real `lastModified` (total 654 URLs), ensured absolute trailing-slash canonicals, single `h1` per page (fixed authoring and submission detail skeletons), resolved duplicate titles, added missing descriptions, complete OG/Twitter tags, and fixed Vercel trailing-slash redirects. |
| **Phase S3** | Structured Data (JSON-LD) | **Done** | Added server-rendered Schema.org-valid JSON-LD: `WebSite` with `Person` publisher (Snowi) and `CollectionPage` on homepage; `CollectionPage` and `ItemList` on Path and Visualizer; `LearningResource` on problems and visualizer slugs; `AboutPage`, `Person`, and `FAQPage` on About; and `BreadcrumbList` across all hierarchical paths. |
| **Phase S4** | AEO & GEO Optimization | **Done** | Implemented visible FAQ section on `/about/` with answer-first sentences and `FAQPage` JSON-LD markup. Created `public/llms.txt` plain-text index covering curriculum, architecture, and free-access model. |
| **Phase S5** | Performance & Crawl Efficiency | **Done** | Verified Core Web Vitals, image alts/dimensions, mobile layout parity, and zero runtime performance regressions. |
| **Phase S6** | Tooling & Monitoring Guides | **Done** | Added Bing verification environment variable support, created `scripts/seo-check.mjs` (`npm run seo:check`) validating 708 static HTML exports, and wrote `docs/SEO_NEXT_STEPS.md`. |
| **Phase S7** | Senior QA Verification & Final Report | **Done** | Full verification completed: `npm run seo:check` (0 errors), `npm run typecheck` (passed), `npm run lint` (passed), `npm test` (20 files, 754 tests passed), Playwright E2E suite, and compiled comprehensive `docs/SEO_REPORT.md`. |

---

## Current System Health & Status
- **Audit Findings:** Logged in `docs/SEO_AUDIT.md`.
- **Decisions Log:** Updated in `docs/DECISIONS.md`.
- **Final Report:** Completed in `docs/SEO_REPORT.md`.
- **Verification:** Google Search Console verification meta tag live on `https://iwons.vercel.app/`.

NEXT ACTION: None (All phases S0–S7 complete and verified).
