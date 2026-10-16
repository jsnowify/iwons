# Iwons

**Type it. Test it. Own it.** A browser-only coding practice app redesigned from the supplied _Iwons Vibe Coding Master Prompt_ Markdown brief.

## Run locally

Requires Node.js 22.18+ and npm. This workspace was verified with Node.js 24.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Explore the Path or open **Your desk** and choose **Make it yours** to set your name, language, and Watch consent before running code.

For the production static build:

```sh
npm run build
npm start
```

The production preview runs at http://127.0.0.1:3000. The build output is `out/`. `next start` is not used because this app has no server runtime.

The wordmark uses a static block cursor. Skeleton pulse and the editor caret retain their separate loading and editing behavior.

## What is included

- Next.js App Router, strict TypeScript, Tailwind, and Paper and Night themes, typewriter typography, and self-hosted fonts.
- A new landing page, personal dashboard, nine-level Path map, and primers for all nine chapters.
- **500 original challenges** in 54 units across Levels 0 to 8, with four-language starters, three visible and six hidden cases each.
- Chapter unlocking at 70%, a free-browse option, readable text, motion controls, and an optional carriage bell.
- A v3 migration that archives previous submissions, progress, notes, lists and drafts. Retired problem URLs explain the change.
- Search, difficulty/topic/status filters, sorting, bookmarks, and custom lists.
- Resizable Monaco workspace, per-language drafts, progressive hints, notes, gated editorials, custom cases, stdout, verdicts, and case comparisons.
- JavaScript/TypeScript execution in disposable workers; lazy Python through Pyodide; configurable Java Beta adapter.
- Submission history, reopen-in-editor, local progress, activity calendar, streaks, XP, milestones, clean solves, and a downloadable Flex Card PNG.
- Spaced repetition, 30-day and 14-day study plans, fullscreen contests and mock interviews with a shared timer.
- Custom-problem authoring, JSON problem import, and reference-solution checks.
- Consent-based Iwons Watch, focus/visibility/paste/fullscreen/typing-burst/second-tab signals, scoring, and self-reported welcome-back notes.
- Versioned local storage, quota recovery, backups, import validation, and confirmed reset.
- Static SEO pages, topic pages, per-problem social images, JSON-LD, sitemap, robots, web manifest, and service-worker caching.
- Keyboard shortcuts, responsive layouts, reduced motion, accessible dialogs, loading states, and a `/design/` component gallery.

## Verification

The current [redesign audit](docs/REDESIGN.md), [verification results](docs/VERIFICATION.md), and [54 curriculum reports with sample statements](docs/curriculum-reports/README.md) document the 500-problem release.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The unit/integration suite checks all 4,500 cases against the JavaScript and TypeScript worker and independent Python reference solutions. Python 3 is required for the native Python reference test. Java harness tests run when a JDK is available. The app itself requires neither Python nor Java installed locally.

Playwright covers onboarding, accepted/wrong/invalid/non-terminating solutions, actual browser Pyodide execution, persistence, custom authoring, lists, responsive themes, SEO HTML, and offline reload. Install its browser if needed with `npx playwright install chromium`.

`npm run validate:problems` executes every reference in the actual JS/TS worker, the exact Python harness, strict TypeScript checking, and native Java. A JDK and Python 3 are required for curriculum validation. Per-unit reports and three sample statements are saved in `docs/curriculum-reports/`.

`npm run seed` regenerates the problem JSON, lazy test/editorial packs, development references, and compact search and level-unlock indexes from `scripts/seed.mjs`. Hidden cases and editorials are not in the initial page HTML. Because this is a static app, they can still be downloaded or inspected by a determined user.

## Java Beta

In **Settings → Java runtime**, enter your own CORS-enabled **Judge0 CE** URL. The worker discovers its Java language, generates a JSON harness, submits the source, and polls for results. Your Java code and test inputs go to this endpoint. No default third-party judge is configured.

The harness has been compiled and tested with a local JDK for all 500 problems and 4,500 cases. A live Judge0 service is not included and must be independently configured and tested. CheerpJ is deliberately unavailable until browser compiler packaging and licensing are resolved; it is not simulated.

Official references: [Judge0 CE](https://ce.judge0.com/), [CheerpJ licensing](https://cheerpj.com/licensing/), [Pyodide worker documentation](https://pyodide.org/en/stable/usage/webworker.html).

## Data and runtime limits

- Data stays in this browser. No accounts, database, sync, analytics, or Iwons backend. Export a backup before clearing browser storage.
- Storage access is centralized in `src/lib/storage.ts`, under `iwons:v3:*`. Original `iwons:v1:*` and `iwons:v2:*` keys remain intact through the Legacy Archive, and v1/v2/v3 backup imports are supported. Up to 20 submissions are retained per problem, preserving an accepted solve. Cleanup keeps recent submissions and accepted solves.
- Watch is an honor system. It cannot see another website, app, browser, phone, camera, or screen. It never records individual keystrokes. Browser-size devtools heuristics are intentionally omitted because they are unreliable.
- Worker timeouts keep the UI responsive. Workers are not a security boundary for running hostile code: use code you trust.
- Monaco is served locally. Python downloads pinned Pyodide 314.0.7 from jsDelivr on demand; the first Python run requires internet. Offline features depend on resources having been cached successfully. Java requires its endpoint to be reachable.
- Local-only submission detail and custom problem URLs use `/submissions/detail/?id=…` and `/problems/custom/?id=…`. These static shells avoid requiring a backend for dynamic local IDs.
- Flex Cards are local self-reported stats, not verified certificates. Activity reflects retained submission history.

## Deploy

The project is configured for Vercel with Next.js static output. Use `npm run build`, publish `out/`, and keep the generated `sw.js` uncached or revalidated by the host.

Set `NEXT_PUBLIC_SITE_URL` to your final canonical origin when publishing to a custom domain. On Vercel, a deployment's `VERCEL_URL` is the automatic fallback; locally it falls back to `http://localhost:3000`. No secrets are required for the app.

Search Console submission and third-party structured-data validation require the final published domain. Lighthouse and browser test results are local checks, not a guarantee across every browser, device, or hosting environment.
# iwons
