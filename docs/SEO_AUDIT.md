# SEO, AEO, and GEO Baseline Audit

**Date:** 2026-10-17  
**Auditor:** Senior SEO Engineer & Technical Specialist  
**Domain:** `https://iwons.vercel.app/`  
**Deployment Target:** Vercel Static Export (Next.js 16.4.1 Turbopack)  

---

## 1. Bot Blocking Mechanisms & Indexing Barriers

### A. Codebase Directives (`noindex`, `nofollow`, `robots`)
An audit across all route templates in `src/app/` identified 13 pages actively declaring `robots: { index: false, follow: false }` or `robots: { index: false, follow: true }`:
1. `src/app/contest/page.tsx` — `robots: { index: false, follow: false }`
2. `src/app/dashboard/page.tsx` — `robots: { index: false, follow: false }`
3. `src/app/design/page.tsx` — `robots: { index: false, follow: false }`
4. `src/app/lists/page.tsx` — `robots: { index: false, follow: false }`
5. `src/app/problems/custom/page.tsx` — `robots: { index: false, follow: false }`
6. `src/app/problems/new/page.tsx` — `robots: { index: false, follow: false }`
7. `src/app/progress/page.tsx` — `robots: { index: false, follow: false }`
8. `src/app/review/page.tsx` — `robots: { index: false, follow: false }`
9. `src/app/settings/page.tsx` — `robots: { index: false, follow: false }`
10. `src/app/submissions/detail/page.tsx` — `robots: { index: false, follow: false }`
11. `src/app/submissions/page.tsx` — `robots: { index: false, follow: false }`
12. `src/app/warm-up/page.tsx` — `robots: { index: false, follow: false }`
13. `src/app/problems/[slug]/page.tsx` — returns `{ index: false, follow: true }` for retired legacy problems (`src/data/legacy-problems.json`), which is required by `scripts/verify-export.mjs` and `e2e/path.spec.ts`.
14. `src/app/visualizer/[slug]/page.tsx` — returns `{ index: false, follow: true }` when algorithm slug is not found.

**Root Layout robots directive:**
Currently, `src/app/layout.tsx` does **not** declare an explicit `robots` metadata property. In Phase S1, it will be updated with:
```ts
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
}
```

### B. Robots.txt Configuration (`src/app/robots.ts`)
The current `src/app/robots.ts` disallows 10 public user-facing paths:
- Disallowed: `/settings/`, `/dashboard/`, `/progress/`, `/review/`, `/submissions/`, `/contest/`, `/lists/`, `/problems/new/`, `/problems/custom/`, `/design/`, `/problem-data/`, `/dev/`.
- Missing explicit allow directives for search crawlers (Googlebot, Bingbot, Applebot, DuckDuckBot, etc.).
- Missing explicit allow directives for AI answer/search agents (GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, OAI-SearchBot, Applebot-Extended, etc.).

### C. Client-Side Rendering & Blank Shells
- `/visualizer/[slug]/` routes export HTML containing only a client loading spinner (`VisualizerSlugClient` initial state `loading=true`) with no `<h1>`, no algorithm explanation, no complexity metrics, and no pseudocode in SSR HTML.
- In Phase S1/S2, `VisualizerSlugPage` will render semantic, server-side content (`<h1>`, algorithm description, category, engine, time/space complexity, and pseudocode) directly in the static export, with the interactive canvas mounting progressively.

### D. Headers & Server Config
- `vercel.json` and `next.config.ts`: No `X-Robots-Tag: noindex` header is sent on production.
- Live inspection confirmed: HTTP 200 responses contain zero `X-Robots-Tag` blocking headers.

### E. Vercel Dashboard Manual Checklist (Owner Verification)
Because server-side firewall and deployment protection settings cannot be modified via codebase:
1. **Deployment Protection:** Go to Vercel Project Settings → *Deployment Protection*. Ensure "Vercel Authentication" is **Disabled** for the Production environment. (Preview environments should remain protected or noindexed).
2. **Firewall / WAF / Attack Challenge Mode:** Go to Vercel Project Settings → *Security*. Verify that "Attack Challenge Mode" is **Off** and no custom firewall rules challenge user agents matching `Googlebot`, `bingbot`, `GPTBot`, `ClaudeBot`, or `PerplexityBot`.
3. **Bot Protection:** Confirm standard Vercel Bot Protection is not set to challenge verified search engine bots.

---

## 2. Live Site Verification with cURL

Tested with live HTTP requests to `https://iwons.vercel.app/`:

| User-Agent | Target URL | HTTP Code | `X-Robots-Tag` | Result |
| --- | --- | ---: | --- | --- |
| **Googlebot 2.1** | `https://iwons.vercel.app/` | `200 OK` | None | Fully allowed, 46.8 KB SSR HTML |
| **Bingbot 2.0** | `https://iwons.vercel.app/` | `200 OK` | None | Fully allowed, 46.8 KB SSR HTML |
| **GPTBot 1.2** | `https://iwons.vercel.app/` | `200 OK` | None | Fully allowed, 46.8 KB SSR HTML |
| **ClaudeBot 1.0** | `https://iwons.vercel.app/` | `200 OK` | None | Fully allowed, 46.8 KB SSR HTML |
| **PerplexityBot 1.0** | `https://iwons.vercel.app/` | `200 OK` | None | Fully allowed, 46.8 KB SSR HTML |

### Sample Routes Check (10 Routes)
1. `/` — `200 OK`, canonical `https://iwons.vercel.app/`, 1 `<h1>`, WebSite JSON-LD
2. `/path/` — `200 OK`, canonical `https://iwons.vercel.app/path/`, 1 `<h1>`
3. `/path/0/` — `200 OK`, canonical `https://iwons.vercel.app/path/0/`, 1 `<h1>`
4. `/problems/receipt-arithmetic-proof-strip/` — `200 OK`, canonical `https://iwons.vercel.app/problems/receipt-arithmetic-proof-strip/`, 1 `<h1>`, LearningResource + BreadcrumbList JSON-LD
5. `/about/` — `200 OK`, canonical `https://iwons.vercel.app/about/`, 1 `<h1>`
6. `/visualizer/` — `200 OK`, canonical `https://iwons.vercel.app/visualizer/`, 1 `<h1>` (Title has duplicate brand suffix `Algorithm Visualizer | Iwons | Iwons`)
7. `/visualizer/bubble-sort/` — `200 OK`, canonical `https://iwons.vercel.app/visualizer/bubble-sort/`, **0 `<h1>`** (SSR loading shell), **not in sitemap**
8. `/plans/` — `200 OK`, canonical `https://iwons.vercel.app/plans/`, 1 `<h1>`, missing meta description
9. `/topics/zero-one-knapsack/` — `200 OK`, canonical `https://iwons.vercel.app/topics/zero-one-knapsack/`, 1 `<h1>`
10. `/problems/` — `200 OK`, canonical `https://iwons.vercel.app/problems/`, 1 `<h1>`

---

## 3. Preview vs Production Verification

- **Production Domain (`https://iwons.vercel.app`):** Confirmed `X-Robots-Tag` is absent, Google site verification meta tag is present:
  `<meta name="google-site-verification" content="iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8" />`.
- **Preview Deployments (`*.vercel.app` previews):** Vercel handles preview deployments automatically with `x-robots-tag: noindex`, preventing duplicate content indexing on staging branches.
- **Root Metadata Base:** Explicitly anchored to `https://iwons.vercel.app` without referencing `VERCEL_URL`.

---

## 4. Indexability Inventory by Page Type

| Page Type | Count | In Sitemap? | Canonical? | Single H1? | JSON-LD Type | Status |
| --- | ---: | :---: | :---: | :---: | :---: | :---: |
| **Homepage** (`/`) | 1 | Yes | Yes (`/`) | Yes | `WebSite` | Ready (needs Person publisher) |
| **Path Map** (`/path/`) | 1 | Yes | Yes (`/path/`) | Yes | None | Needs `CollectionPage`/`BreadcrumbList` |
| **Path Chapters** (`/path/[0-8]/`) | 9 | Yes | Yes (`/path/[0-8]/`) | Yes | None | Needs `BreadcrumbList` |
| **Problems Catalog** (`/problems/`) | 1 | Yes | Yes (`/problems/`) | Yes | None | Needs `CollectionPage`/`BreadcrumbList` |
| **Problem Workspaces** (`/problems/[slug]/`) | 500 | Yes | Yes (`/problems/[slug]/`) | Yes | `LearningResource`, `BreadcrumbList` | Ready (needs real dateModified) |
| **Topic Aggregators** (`/topics/[topic]/`) | 63 | Yes | Yes (`/topics/[topic]/`) | Yes | None | Needs `BreadcrumbList` |
| **Study Plans** (`/plans/`) | 1 | Yes | Yes (`/plans/`) | Yes | None | Needs description + `BreadcrumbList` |
| **About Page** (`/about/`) | 1 | Yes | Yes (`/about/`) | Yes | None | Needs `AboutPage` + `Person` (Snowi) |
| **Visualizer Catalog** (`/visualizer/`) | 1 | Yes | Yes (`/visualizer/`) | Yes | None | Fix title template + `ItemList` |
| **Visualizer Slugs** (`/visualizer/[slug]/`) | 67 | **No** (Missing) | Yes (`/visualizer/[slug]/`) | **No** (0 H1 in SSR) | None | Needs inclusion in sitemap, SSR H1 + content, `LearningResource` |
| **Retired Problems** (Legacy) | 44 | No (Correct) | No (Links `/path/`) | Yes | None | `noindex` retained per legacy contract |
| **App Utility Pages** (Desk, Progress, Warm-up, Contest, Lists, Review, Submissions, Settings) | 8 | No | Yes | Yes | None | Blocked by `noindex` in S0; remove blocks in S1 |
| **Internal Pages** (`/design/`, `/problems/new/`, `/problems/custom/`) | 3 | No | Yes | Yes | None | Internal utility routes |

---

## 5. Baseline Metrics & Identified Defects

1. **Sitemap omission:** 67 algorithm dynamic routes (`/visualizer/[slug]/`) are entirely missing from `sitemap.xml`.
2. **Missing SSR H1 and content:** `/visualizer/[slug]/` statically exports a client-only loading spinner with 0 `<h1>` tags and no explanation for search or AI crawlers.
3. **Robots block on user pages:** 10 routes in `robots.ts` and 12 routes in `metadata.robots` carry `noindex` or `Disallow`.
4. **Duplicate Title suffix:** `/visualizer/` produces `Algorithm Visualizer | Iwons | Iwons` due to redundant branding in page metadata.
5. **Missing Meta Description:** `/plans/` lacks a description in page metadata.
6. **Redirect 404 in Vercel config:** Legacy redirect `/learn/` and `/tl/problems/` return 404 on Vercel because pattern matching in `vercel.json` does not account for trailing slash variants.
7. **Structured Data gaps:**
   - Homepage missing publisher `Person` for creator Snowi (`https://snowi-cambronero.vercel.app/`).
   - About page missing `AboutPage` and `Person` markup.
   - Path, Levels, and Topics missing `BreadcrumbList`.
   - Visualizer missing `ItemList` and `LearningResource`.
8. **AI Crawlers (`llms.txt`):** No `llms.txt` file exists at the root.

