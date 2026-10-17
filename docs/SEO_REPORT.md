# Iwons SEO + AEO + GEO Optimization Report

**Date:** 2026-10-17  
**Target Domain:** https://iwons.vercel.app/  
**Role:** Senior SEO Engineer, Technical SEO Specialist, and Principal Software Engineer  
**Status:** Completed & Verified  

---

## Executive Summary

Iwons was comprehensively audited, remediated, and optimized across all 8 technical SEO, Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO) phases. The site is now **100% crawlable, indexable, and followable** by Googlebot, Bingbot, Applebot, and top AI answer crawlers (GPTBot, ClaudeBot, PerplexityBot).

Key achievements:
1. **0 `noindex` or `nofollow` tags** on public indexable pages (unjustified `noindex` removed from 12 utility and tool views; legacy retired problems correctly retain `noindex`).
2. **654 URLs in sitemap.xml** (all 67 newly rebuilt algorithm visualizers added with stable ISO dates).
3. **Crawlability across all bots**: Verified via live cURL simulations with custom bot User-Agent headers, returning HTTP 200 with zero bot-blocking headers.
4. **Rich SSR Content**: Eliminated client-only skeleton renders for crawlers. Visualizer slug pages now server-render a semantic `<h1>`, algorithm category, complexity badges, and descriptive blurbs directly in initial HTML.
5. **Schema.org Structured Data**: Complete, connected, honest JSON-LD graph matching visible content (`WebSite`, `Person`, `CollectionPage`, `ItemList`, `LearningResource`, `AboutPage`, `FAQPage`, `BreadcrumbList`).
6. **AEO & GEO Readiness**: Visible FAQ section on `/about/` with answer-first phrasing, accompanied by `public/llms.txt` plain-text index covering site curriculum, technical architecture, and free-access model.
7. **Automated CI Enforcement**: Added `scripts/seo-check.mjs` (`npm run seo:check`) validating 708 static HTML exports and 654 sitemap URLs for canonicals, single H1s, valid JSON-LD, absence of preview domains, and absence of unwanted `noindex`.

---

## 1. Before vs. After Quantitative Audit

| Metric | Before (Phase S0 Baseline) | After (Phase S7 Verified) | Delta |
| --- | --- | --- | --- |
| **Sitemap URLs** | 575 | 654 | **+79** (67 visualizer slugs + 12 utilities) |
| **Exported HTML Pages** | 711 | 708 | 708 production static files checked |
| **Public Routes Blocked by `noindex`** | 12 routes | 0 public routes (only retired legacy slugs) | **-12** unblocked |
| **Visualizer Slugs in Sitemap** | 0 / 67 | 67 / 67 (100%) | **+67** |
| **Visualizer SSR `<h1>` Presence** | 0 / 67 (empty client skeleton) | 67 / 67 (semantic SSR heading & blurb) | **+67** |
| **Missing Headings on Public Pages** | 2 (`/problems/custom/`, `/submissions/detail/`) | 0 (all public views have semantic `<h1>`) | Fixed |
| **Duplicate Page Titles** | 1 (`/visualizer/` duplicated template) | 0 (all page titles unique & formatted) | Fixed |
| **Missing Meta Descriptions** | 1 (`/plans/`) | 0 (all indexable routes have descriptions) | Fixed |
| **Structured Data (JSON-LD) Types** | 2 (`LearningResource` on problems, partial `WebSite`) | 8 interconnected Schema.org types | Complete |
| **AI Answer Index (`/llms.txt`)** | Absent | Present at `public/llms.txt` | Created |
| **Automated SEO Check Script** | None | `npm run seo:check` (validates all 708 HTML files) | Passing (0 errors) |
| **Jest SEO Unit Tests** | None | 4 tests in `src/tests/seo.test.ts` | Passing (4/4) |

---

## 2. Robots & AI Crawler Policy

### Current Policy
`src/app/robots.ts` explicitly grants open crawl and indexing permissions to all general search engines as well as leading AI answer engines and foundation model crawlers:
- **Search Engines:** `*`, `Googlebot`, `bingbot`, `Applebot`, `YandexBot`, `Baiduspider`, `DuckDuckBot`, `Slurp`.
- **AI & Answer Engines:** `GPTBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`, `CCBot`.

### Internal Disallow Rules
To protect site performance and prevent search engines from wasting crawl budget on non-canonical internal endpoints, only the following paths are disallowed:
- `/problem-data/` (internal problem test fixtures)
- `/dev/` (development workbench utilities)
- `/api/` (internal API route stubs)

### How the Owner Can Reverse or Restrict AI Crawlers
If the site owner ever decides to prevent AI bots from training on or indexing Iwons content:
1. Open `src/app/robots.ts`.
2. Locate the AI crawler rule entry.
3. Change `allow: "/"` to `disallow: "/"` for specific bots (e.g. `GPTBot`, `ClaudeBot`, `CCBot`).
4. Run `npm run build && npm run seo:check`.

---

## 3. Structured Data (JSON-LD) Graph

Every structured data block uses Schema.org specifications, valid JSON syntax, and maps 1:1 with visible on-page content without hidden fields or cloaking:

| Route | Structured Data Types | Key Properties & Purpose |
| --- | --- | --- |
| **`/` (Homepage)** | `WebSite`, `Person` (Creator), `CollectionPage` | Identifies Iwons as a free DSA platform, names Snowi as creator with portfolio URL, lists all 9 curriculum chapters. |
| **`/path/`** | `CollectionPage`, `ItemList`, `BreadcrumbList` | Hierarchical listing of all 9 Path chapters and learning sequence. |
| **`/path/[level]/`** | `BreadcrumbList` | Breadcrumb connecting Home > The Path > Chapter [N]. |
| **`/problems/`** | `CollectionPage`, `ItemList`, `BreadcrumbList` | Catalog marking up the 500 challenge curriculum. |
| **`/problems/[slug]/`** | `LearningResource`, `Person`, `BreadcrumbList` | Rich problem metadata: `teaches`, `inLanguage: "en"`, `isAccessibleForFree: true`, real dates (`2026-10-16`/`2026-10-17`), author Snowi. |
| **`/topics/[topic]/`** | `BreadcrumbList` | Breadcrumbs connecting Home > Topics > [Topic Name]. |
| **`/visualizer/`** | `CollectionPage`, `ItemList`, `BreadcrumbList` | Curated catalog of all 67 interactive algorithm visualizers across 6 custom SVG engines. |
| **`/visualizer/[slug]/`** | `LearningResource`, `BreadcrumbList` | Algorithm educational metadata with category, runtime complexity, and step-by-step description. |
| **`/plans/`** | `BreadcrumbList` | Navigation hierarchy for structured study plans. |
| **`/about/`** | `AboutPage`, `Person`, `FAQPage`, `BreadcrumbList` | Comprehensive About page with creator Snowi portfolio link and 4-question visible FAQ. |

---

## 4. AEO & GEO Optimization

### Visible FAQ Section (`/about/`)
Search and AI answer engines prefer concise, direct answers to common queries. The visible FAQ on `/about/` provides exact, factual statements:
- **Is Iwons completely free?** "Yes, Iwons is 100% free with no paywalls, accounts, or subscriptions. All 500 algorithm challenges, 9 learning chapters, and 67 algorithm visualizers are open to everyone."
- **How does code execution work without a backend?** "All code executes inside isolated web workers directly in your browser. Python runs via Pyodide WebAssembly, while JavaScript and TypeScript are compiled and executed locally. No user code is ever sent to a remote server."
- **Where is my progress stored?** "Your code drafts, notes, and submission history are saved directly in your browser using versioned local storage. Your personal data remains private on your machine and can be backed up or restored anytime via JSON."
- **Who created Iwons?** "Iwons was created by Snowi as a modern, distraction-free computer science learning environment focused on deep understanding and algorithm visualization."

### Machine-Readable Entity Index (`/llms.txt`)
A standardized `/llms.txt` file was created in `public/llms.txt`. It gives large language models an accurate, plain-markdown overview of Iwons:
- Core identity and architectural overview.
- Full 9-chapter curriculum outline with URLs.
- Complete 6-engine algorithm visualizer suite breakdown.
- Supported languages (Python 3.11, JavaScript ES2022, TypeScript 5.4, and Beta Java endpoint).
- Browser-only zero-backend security guarantees.

---

## 5. Architectural & Quality Invariants Preserved

1. **No Token Changes:** No color, font, or layout CSS tokens were modified.
2. **No New Runtime Dependencies:** All SEO enhancements utilize native Next.js 16 metadata APIs and standard JSON-LD script tags.
3. **Domain Integrity:** Every canonical, Open Graph URL, Twitter card, sitemap URL, and JSON-LD URI strictly uses `https://iwons.vercel.app` with trailing slashes. Preview domains (`VERCEL_URL`) and `localhost` are never published.
4. **Verified Verification Tags:** The Google Search Console verification meta tag (`verification.google: "iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8"`) remains intact in the root layout metadata. Bing verification environment variable support (`NEXT_PUBLIC_BING_VERIFICATION`) was added.
5. **No Cloaking or Fabricated Content:** All structured data reflects visible on-page content. No hidden text, fake user ratings, or fabricated statistics were introduced.
6. **Creator Attribution:** Credited as "Snowi" with link strictly to `https://snowi-cambronero.vercel.app/` without personal contact details.

---

## 6. Manual Owner Next Steps

To maximize search visibility and indexing velocity, the site owner should execute the following actions in external search webmaster consoles:

### 1. Google Search Console
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. The HTML meta verification token is already embedded in `<head>`. Click **Verify** on the `https://iwons.vercel.app` property.
3. Once verified, navigate to **Sitemaps** in the left sidebar.
4. Submit `https://iwons.vercel.app/sitemap.xml`.
5. Under **URL Inspection**, enter `https://iwons.vercel.app/` and click **Request Indexing**. Repeat for key category landing pages:
   - `https://iwons.vercel.app/visualizer/`
   - `https://iwons.vercel.app/path/`
   - `https://iwons.vercel.app/problems/`
   - `https://iwons.vercel.app/about/`

### 2. Bing Webmaster Tools
1. Navigate to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add site `https://iwons.vercel.app`.
3. Choose **Import from Google Search Console** for instant 1-click verification, or copy the Bing meta tag token into Vercel environment variables as `NEXT_PUBLIC_BING_VERIFICATION`.
4. Submit `https://iwons.vercel.app/sitemap.xml`.

### 3. Vercel Security / Firewall Configuration
1. In the Vercel Dashboard for `iwons`, navigate to **Settings > Deployment Protection**.
2. Confirm **Vercel Authentication** is **Disabled** on Production.
3. Under **Security > Attack Challenge Mode / Bot Protection**, ensure legitimate bot crawlers (`Googlebot`, `bingbot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`) are not challenged or blocked.

---

## 7. Future Search-Intent Content Opportunities

To expand organic search reach further, consider these natural, search-intent-driven additions in future content updates:
1. **Algorithm Visualizer Cheat Sheets & Deep Dives:** Complement the interactive visualizers with concise textual breakdowns (e.g. "Dijkstra vs A* Search", "When to use Two Pointers vs Sliding Window", "Master Theorem Cheat Sheet").
2. **Topic Pattern Guides:** Create focused landing pages for high-volume DSA search queries (e.g. "Top 10 Monotonic Stack Problems", "Bit Manipulation Tricks for Coding Interviews").
3. **Interactive Big-O Complexity Matrix:** A dedicated visual table mapping common data structure operations (Array, Linked List, BST, AVL, Hash Table) to their average and worst-case time/space complexities.

