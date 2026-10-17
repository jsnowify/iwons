# Learn removal and performance report

Completed 2026-10-17. Source: removal/performance brief d002c792-687c-4811-998f-86e1391ef587. All implementation phases are committed locally; no deployment or remote cache change was performed.

The final controlled Next build took **44.66 s**, versus **151.80 s** before (70.6% less time). Static entries fell from **1,641 to 644**. Learn is removed from the active app; its full implementation is preserved on `archive/learn-v1` at `63b10c152434b3e78dbdfc902dc5fbb9e31b6c78`. Existing storage namespaces and backup compatibility remain intact.

## Build, cache and development

| Measure | Before | After |
| --- | ---: | ---: |
| Next trace duration | 151.80 s | 44.66 s |
| Prerender manifest entries | 1,641 | 644 |
| OG route entries | 518 | 0 |
| Learn route entries | 457 | 0 |
| .next size | 811,532,226 bytes | 554,273,620 bytes |
| .next/cache size | 348,398,488 bytes | 86,106,808 bytes |

The trace measures Next itself, excluding npm prebuild/postbuild work. Both production measurements use their existing local caches; this is not a cold-build benchmark. Entry counts include static handlers and retired URLs, not just learner-facing HTML pages. `.next` includes local development and diagnostic files, so its size is not deployment payload size. The final cache size follows removal of obsolete production-only webpack cache directories; development caches were left alone. No claim attributes a particular percentage of elapsed time to Satori alone.

Fresh isolated dev cache, same request order in both runs: server startup, `/`, then the first problem. The second route can reuse the compiled shared layout. Webpack announced ready in 1.68 s but both requests timed out at 45 s. Turbopack announced ready in **4.01 s**; the homepage returned HTTP 200 in **13.30 s** and the first problem in **2.95 s**. Ready time is reported separately from usable-page time.

Raw artifacts: `artifacts/performance/before.json`, `after.json`, `before-dev.{json,log}`, `after-dev.{json,log}`.

## Initial script bundles

Scripts referenced by each exported HTML document, including any legacy script tags. Gzip is measured per file; later dynamic imports, HTML/RSC props, CSS, fonts and runtime downloads are excluded. These are consistent before/after script-size measurements, not total network-transfer measurements.

| Route | Raw before | Raw after | Gzip before | Gzip after |
| --- | ---: | ---: | ---: | ---: |
| `/` | 639,841 | 629,797 | 201,936 | 196,401 |
| `/path/` | 658,962 | 641,161 | 208,804 | 199,884 |
| `/path/0/` | 658,808 | 641,161 | 208,645 | 199,884 |
| `/problems/receipt-arithmetic-proof-strip/` | 704,512 | 671,768 | 224,577 | 210,080 |
| `/progress/` | 1,141,401 | 663,084 | 246,275 | 208,735 |
| `/settings/` | 664,403 | 648,700 | 209,717 | 202,358 |

Byte counts. Source catalog/curriculum sizes remain 398,817/376,748 bytes because the original 500 challenges and 54 units are unchanged. Cached filesystem reads and route-specific client props replace large JSON imports. The Next analyzer snapshot (`artifacts/performance/bundle-graph.jsonl`, 1,720 module records, 26 route patterns) contains neither JSON module. Editor and runner modules are asynchronous groups on problem pages; search is asynchronous too.

## Lighthouse

One final-source mobile/throttled run per URL on a shared development machine. These are lab observations, not field percentiles or guarantees. Repeated runs varied considerably; intermediate and font-priority trial reports are retained in `artifacts/performance/`. The unsuccessful font-preload trial was reverted. The final measurements below were run separately from builds and tests. A verification run that overlapped export was discarded.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 88 | 100 | 100 | 100 | 2.97 s | 300 ms | 0.0020 |
| path | 93 | 100 | 100 | 100 | 2.97 s | 153 ms | 0.0002 |
| level | 86 | 100 | 100 | 100 | 2.71 s | 384 ms | 0.0538 |
| unit | 88 | 100 | 100 | 100 | 3.11 s | 281 ms | 0.0002 |
| problem | 89 | 100 | 100 | 100 | 2.28 s | 370 ms | 0.0004 |
| progress | 85 | 100 | 100 | 63 | 3.46 s | 268 ms | 0.0029 |
| settings | 89 | 100 | 100 | 63 | 3.24 s | 191 ms | 0.0000 |

The unit URL is `/path/0/#receipt-arithmetic`; no independent unit route exists. Progress and Settings intentionally use noindex, explaining their SEO score. The **2.5 s LCP target is not met on every route**, and TBT remains above 200 ms on some routes. Deferred assets and reduced bundles are verified; universal page-load improvement is not claimed.

| Comparable baseline page | Performance before | LCP before | TBT before | CLS before |
| --- | ---: | ---: | ---: | ---: |
| Home | 92 | 2.96 s | 180 ms | 0.0020 |
| Level | 76 | 2.53 s | 390 ms | 0.2329 |
| Unit anchor | 83 | 3.37 s | 348 ms | 0.0001 |
| Problem | 90 | 2.71 s | 280 ms | 0.0004 |

Raw final reports: `artifacts/performance/after-*-lighthouse.json`; aggregate `after-lighthouse.json`.

## Implementation and verification

- Active Learn/locale routes, UI, content, validators and docs removed; static-host redirects and local preview equivalents preserve old links. Archived personal records, settings and v1?v6 backup imports remain compatible.
- 500 individual problem OG images plus a dedicated homepage image are static PNGs. Content-hashed files and stable aliases preserve SEO/link compatibility. Cached source inputs skip the generator entirely; changed entries alone render. Built OG/Twitter images and page canonicals use `https://iwons.vercel.app` by default, never an automatic preview origin. PNG file URLs naturally end in `.png`; page canonicals, sitemap and redirects retain trailing slashes.
- Turbopack works for development and static production export on installed Next 16.4.1. Independent static workers avoid Turbopack emitting raw worker TypeScript. esbuild is a development-only dependency; no runtime dependency, backend or database was added. CI caches `.next/cache`; Vercel retains the standard Next output/cache path, but no remote build/cache result is claimed.
- Editor activation is explicit; runners, Pyodide, strict TypeScript and Visualizer work load on demand. The initial problem view makes no Monaco/runtime requests. Existing next/font families, weights, Latin preload subsets and swap behavior are retained. Unused offline font downloads were removed and offline installation no longer competes immediately with initial route resources.
- One server Footer is instantiated in the root layout. The 100dvh flex structure, existing spacing scale, mobile safe-area/bar reserve and natural problem/output flow keep it reachable. No token colors, fonts or layout tokens changed. Snowi is credited on About using the portfolio link only. The later user instruction removes the shared footer credit.
- **Production build/export/privacy/image checks, ESLint, typecheck, 547 unit tests and all 45 Playwright tests pass.** Next 16 removed `next lint`; `npm run lint` invokes ESLint directly. The baseline 600 tests included the removed Learn suite; active compatibility tests remain, with three new Warm-up behavior tests.
- Browser checks cover Path gates, real JS/TS/Python execution, timeout/error handling, drafts, notes, backups, Watch, contests, first-solve XP/achievement, Warm-up ratings, Visualizer stepping, Tik, themes, metadata and cache headers. **Live Java execution is not verified:** no endpoint is configured. Its honest unavailable-state guard passes; no execution is simulated.
- All eight main route views at 360/390/768/1024/1440 in both themes pass (80 observations). An additional mobile editor/output/footer check passes. Standalone audit records zero console/page errors, horizontal overflows, missing footers or overlaps. Geometry checks wait for fonts and allow one-pixel browser rounding; they explicitly compare main/footer/mobile-bar edges.

Bottom artifacts: `artifacts/bottom-layout/{before,after}.json` and corresponding `before-home.png`, `after-home.png`, `before-about.png`, `after-about.png`, `before-problem.png`, `after-problem.png`. Before, 70 of 80 observations lacked a footer; after, every observation has one. Build/test logs are `artifacts/final-{build,lint,typecheck,unit,browser}.log`. Artifacts are local and ignored by Git.

## Restore the archived implementation

Inspect or recover the complete historical implementation in a separate working tree:

```sh
git worktree add ../iwons-learn-archive archive/learn-v1
```

The earlier **IWONS: FOUNDATIONS + LEARNING SCIENCE ENGINE** prompt is preserved in the original attachment at `C:/Users/joshu/.codex/attachments/8986d257-03d8-4633-b0ea-a07df4ee1903/Pasted text.txt`; it is historical context, superseded by this removal brief. The archive includes the unfinished second module, routes, content, validators, tests and old documentation. Before integrating any course code again, apply the English-only page-count budget and preserve this performance pipeline, production metadata and storage compatibility. Do not restore retired locale routes or the old preview-domain fallback. No active course/translation expansion is planned by this task.

## Navigation follow-up: 2026-10-17

The user reported that page transitions still felt slow and explicitly removed the footer creator credit. Shared sidebar/mobile/header links and landing shortcuts had `prefetch={false}`. They now use Next's scheduled production prefetching. The Path map receives only its displayed fields, excluding primer/example strings. Problem-list topics, combined cards and bookmarks remain memoized while typing or changing unrelated UI state. The footer credit and its unused styles are removed; About retains the creator credit.

A repeatable four-route production preview comparison uses Chromium, 150 ms network latency, 200,000 bytes/s download, 4x CPU throttling, service workers blocked and a three-second reading interval before each click. Timing includes Playwright click, URL transition and visible main heading. Final after measurement ran after build and all tests had exited. These are single local lab observations, not field percentiles or a zero-latency guarantee.

| Route | Before | After |
| --- | ---: | ---: |
| `/path/` | 1123 ms | 545 ms |
| `/problems/` | 1069 ms | 638 ms |
| `/progress/` | 930 ms | 552 ms |
| `/settings/` | 868 ms | 787 ms |

Mean measured transition fell from 997.5 ms to 630.5 ms (36.8%). Raw results: `artifacts/performance/navigation-{before,after}.json`; rerun with `PHASE=after node scripts/measure-navigation.mjs` against preview port 4174 (PowerShell: `$env:PHASE="after"`). Production prefetch does not run in `next dev`; use the completed export with `npm start` to evaluate production speed. Development still compiles routes on demand.

`npm run build`, typecheck, ESLint, 547 unit tests and all 45 browser tests pass. New navigation coverage verifies destination RSC requests happen before a click, shared-window state survives navigation without a document reload, no editor/runtime assets load, and the footer contains no Snowi credit. Logs: `artifacts/navigation-{build,unit,browser}.log`.

## UI follow-up superseding the interaction gates

The next user request explicitly removes the Open editor and Open workbench steps. Monaco now mounts automatically after the local draft hydrates, still in its separate client chunk. User-code workers, strict compilation and Python remain deferred until execution. The Visualizer is visible in server-rendered markup with nine algorithms: binary/linear search, insertion/bubble/selection/merge/quick sort, and grid BFS/DFS. It never auto-plays on page load. A small synthesized tone follows each user-triggered or autoplay frame; a persistent-in-workbench mute control, gesture-only audio unlock and context cleanup avoid unsolicited or continuing audio. System and in-app reduced motion disable autoplay and cell motion.

Progress uses balanced two-column rows and switches to one column according to available content width; its five-pattern default and bounded expanded list remain. Shared native selects use progressive `appearance: base-select` styling, a top-layer attached picker, native keyboard/typeahead behavior and 120 ms token motion. Unsupported browsers retain their native picker. Reduced-motion/forced-color fallbacks remain. No colors/fonts, storage schema or runtime dependencies changed.

These source changes supersede the earlier editor/workbench gating and its initial-Monaco request claim. The earlier Lighthouse and navigation timings describe the previous source and have not been rerun for this UI follow-up.

Verification of the UI follow-up: build/export/privacy checks, typecheck, ESLint, 556 unit tests and 53 browser tests pass. The new browser cases cover actual audio-oscillator creation, gesture gating, per-step counts, mute persistence, autoplay/reduced motion, all nine algorithms, picker appearance and overflow, plus responsive Progress card geometry. Development smoke checks on localhost:3000 pass with no page errors. Screenshots in artifacts/review-*.png and artifacts/visualizer-*.png were visually reviewed. No branch or commit was created.

## Visualizer Rebuild Performance & Bundle Budget Verification (Phase V11)

Completed 2026-10-17. Evaluates the architecture rebuild of the Iwons Algorithm Visualizer across bundle cost, lazy chunking, frame execution budgets, and accessibility compliance.

### 1. Bundle & Export Cost vs Baseline

- **Phase V0 Legacy Baseline:**
  - Monolithic `visualizer.tsx` + `visualizers.ts` loaded all 9 algorithms eagerly into client bundle (628 KB raw, ~200 KB gzip).
  - Fragile DOM cell layout produced 989 px mobile viewport overflow.
- **Phase V11 Rebuilt System:**
  - 6 modular SVG engines (`bars`, `array-pointers`, `grid-table`, `graph`, `tree-heap`, `nodes-arrows`) sharing unified shell and player.
  - **Catalog Page (`/visualizer/`):** 100 KB static HTML containing lightweight metadata (name, category, engine, complexity chips, 2-line blurb) for 67 algorithms across 10 categories. Zero algorithm generator code or heavy step data is loaded on catalog view.
  - **Dynamic Route Pages (`/visualizer/[slug]/`):** Average 28.4 KB static HTML per page across all 67 algorithms.
  - **Code Splitting:** Each algorithm definition (`src/visualizer/algorithms/*`) is bundled as an isolated lazy chunk loaded dynamically via `loadAlgorithmDefinition(slug)`. Opening an algorithm fetches only its specific chunk without downloading the library.
  - **Zero External Dependencies:** Built entirely with pure SVG, CSS transforms, and React 19; no D3, framer-motion, or chart libraries.

### 2. Runtime Frame Budget & Determinism

- Frame budget capped at `MAX_FRAMES_CAP = 5000` with deterministic sampling when inputs exceed bounds.
- Seeded pseudo-random number generator (`createRng` xorshift32) guarantees reproducible presets and debug runs across all platforms.
- Frame precomputation enables O(1) instantaneous timeline scrubbing and backward stepping without DOM re-renders or recalculations.

### 3. Accessibility & Motion Verification

- **Screen Readers:** Pinned caption bar updates with `aria-live="polite"` on every step. Canvas provides an accessible textual summary (`aria-describedby="stage-text-summary"`) detailing element counts, active pointers, comparing indices, and stage state.
- **Reduced Motion:** Fully integrated with `prefers-reduced-motion: reduce` and user in-app setting: autoplay is strictly disabled, CSS animations and bar transitions are turned off, and frame updates jump instantaneously.
- **Keyboard Navigation:** Global shortcuts with input isolation: `Space` (play/pause), `ArrowLeft`/`ArrowRight` (step), `Home`/`End` (scrub ends), `R` (reset), `[`/`]` (speed adjustment).
- **Contrast & Palettes:** All 65 color token pairs pass WCAG AA in both Paper and Night palettes (`npm run contrast`). All engine marks are differentiated by shape, border style, or distinct text tags (e.g. diagonal hatch patterns for sorted elements, dashed borders for eliminated zones, pointer badges) to support color-blind users.

