# Iwons redesign verification

## Latest: marked UI/UX fixes, 2026-10-16

The Learn hierarchy, landing choices, native selects, responsive filters, mobile header and bottom navigation passed **568 unit tests**, **32 browser tests**, typecheck, lint and the **1,338-entry production build**. All **26 Paper/Night Axe scans** at 360/768/1280/1920 px passed with zero violations, overflow or page errors. Four additional collapsed/expanded filter checks at 180 CSS px also have no horizontal overflow. The running development Problems page returns 200 with no page errors and no floating dev-tools badge.

See [the UI/UX record and screenshots](UI-UX-POLISH.md), `artifacts/ui-polish-playwright.json` and `artifacts/ui-polish/`. No data schema, runtime or dependency changed in this follow-up. Earlier Lighthouse measurements below describe their named builds and were not rerun for this styling/navigation change.

## Earlier: Foundations v2 visibility and multi-track infrastructure

The new Learn hub and all four track maps passed **568 unit tests**, **30 browser regressions**, ESLint and the **1,338-entry production build**. Subsequent small changes record exact runtime baselines, highlight the saved default track, and disable automatic prefetch on new Learn links. The final visibility/preference regression, build and 18-scan visual/accessibility sweep passed after those changes. The live development `/learn/` and `/dev/content/` both return 200 with expected content; production diagnostics return 404.

The new hub, module map and three-visualizer workbench passed **18 Axe scans** across Paper/Night at 360, 768 and 1,280 px: zero violations, horizontal overflows or page errors. Screenshots and machine-readable results are in `artifacts/learn-v2/`. Browser report: `artifacts/learn-v2-playwright.json`. Actual JavaScript, TypeScript and Python program workers passed Hello World and stdin; Python reports **3.14.2**, matching the local interpreter. TypeScript diagnostics allow Run warnings and block submission checks.

Final Lighthouse mobile Learn-hub scores: **96 performance / 100 accessibility / 100 best practices / 100 SEO**, with a successful managed-browser audit. Report: `artifacts/learn-v2/lighthouse.json`. The audit uses the already available Lighthouse installation; no dependency was added. The heavy TypeScript compiler stays in the dedicated worker's lazy path.

Storage is now v5 with v4 Foundations progress assigned to Java, retaining original namespaces. The manifest publishes **planned structure**, not lessons: 3 courses, 44 modules, 176 planned lessons, zero ready bodies. Live Java remains blocked by the missing endpoint and insufficient local setup space. Full curriculum, translations, ready lesson/exercise rendering and authored-content validators remain unfinished. See [the v2 audit](FOUNDATIONS-V2-AUDIT.md) and [implementation record](FOUNDATIONS-V2-IMPLEMENTATION.md).

## Earlier: Foundations v1 infrastructure

The authorized infrastructure slice passed typecheck, ESLint, **555 unit tests**, the **1,142-entry production build**, and **all 24 browser tests** in 2.0 minutes. Browser coverage includes v3-to-v4 migration, lesson-language persistence, v4 backup restore, quota-failure export of intact v3 data, existing solves/drafts, legacy archives, hydration, responsive Paper/Night dialogs and the sidebar edge tab. Evidence: `artifacts/foundations-infrastructure-playwright.json`.

Active storage is now edition 4, preserving original namespaces and existing Path data. No Foundations manifest, lessons, exercises or learning routes were published. The content validator intentionally reports the missing approved-manifest gate. Native Java fixture checks do not satisfy live Java readiness; the endpoint remains unconfigured. See [infrastructure details](FOUNDATIONS-INFRASTRUCTURE.md). Visual/Axe/zoom measurements below describe their named earlier builds and were not rerun in full for this slice.

## Earlier verification

Reaudited on 2026-10-16 against the latest attached v2.1 update, retaining the requested v5 contrast and sidebar work. See [the audit and continuation record](REDESIGN.md).

The later Foundations runtime preparation passed typecheck, lint, 532 unit tests, the 1,142-entry production build and three relevant browser regressions (route hydration, development cache cleanup, and JavaScript/TypeScript execution and drafts). Live Java is still blocked: local service setup exceeded available disk space and no endpoint is configured. See [the Foundations audit](FOUNDATIONS-AUDIT.md) and [runtime recovery status](../tools/java-runtime/README.md). The full 20-test browser run and visual/performance measurements below describe the preceding redesign/hydration build.

## Checks

The sidebar edge-tab follow-up subsequently passed the full 22-test browser suite, all 532 unit tests, lint, typecheck and build. It also passed 28 geometry/real-zoom checks and four focused Axe scans with zero violations. See [the edge-tab verification and screenshots](SIDEBAR-EDGE-TAB.md). Earlier broad visual/performance measurements below remain the redesign baseline.

| Check | Result |
| --- | --- |
| Production build | Passed; 1,142 static pages generated, including 500 active problem pages |
| TypeScript and ESLint | Passed |
| Vitest | 532 tests passed, including four new Java worker transport regressions |
| Curriculum | 500 exercises, 54 passing unit reports, 4,500 cases; JS and TS workers, strict TS compilation, exact Python harness, native Java |
| Curriculum integrity | 560 matching file hashes; generated search, count and level indexes match the manifest |
| Playwright | All 20 browser regressions passed with one worker, in 2.2 minutes, including route hydration and development worker cleanup |
| Axe | Final build: 26 scans across 13 screens in Paper and Night; zero violations or page errors |
| Responsive | No page overflow at 360 and 768 px across all 13 audited screens |
| Dialogs | Centered within 2 px at 360, 768 and 1,280 px in both themes, after scrolling; focus loop, Escape, restoration and scroll lock checked |
| Actual browser zoom | 18 checks passed at 200%, both themes; physical widths 360/768/1,280 become CSS widths 180/384/640 |
| WebKit | Real JavaScript and TypeScript worker smoke runs returned Accepted |
| Live Monaco themes | Paper/Night changes match the surface token and preserve code and Accepted results across timer ticks |
| Token contrast | All 65 required comparisons passed across Paper and Night |
| Export privacy | All 500 pages exclude hidden cases and reference solutions from initial HTML; lazy packs and 1,200 x 630 social images verified |
| Retired URLs | All 47 show a friendly Path link and noindex, and are absent from the sitemap |
| Original runtime modules | Eight matched the redesign baseline before Foundations preparation; the later runner index adds a Java-only program guard and the public Java worker adds program transport |

The nine level counts are **30, 50, 50, 55, 45, 55, 55, 70 and 90**. All nine primers are published. Each focused unit ends with a Boss; revisit exercises refer at least two levels back where that distance exists. Levels 0 and 1 are foundation exceptions. [Unit reports and three sample statements per unit](curriculum-reports/README.md) provide the curriculum evidence.

Browser flows cover onboarding; correct, incorrect, invalid and nonterminating code; real browser Python; per-language drafts; notes and submissions; custom authoring and lists; gates and free browse; v1 archival work and v1/v2/v3 backup compatibility; review scheduling; Watch paste, visibility and second-tab signals; fullscreen contests; SEO HTML; offline refresh; all 500 search results; and mobile navigation to Settings. The hydration regression serves landing HTML at a different browser URL, then checks navigation, Back and reload with no React errors. The development worker regression checks cache retirement, automatic refresh and preservation of personal notes and unrelated caches.

The runner's real two-second deadline exposed CPU contention when three browser suites ran together on this machine. The same TypeScript case passed in isolation. The browser suite now runs with one worker; execution timeouts remain intact.

## Loading and performance

Presentation labels no longer import the full 399 KB catalog. Command search loads a 60 KB index when opened; level access uses a 6 KB ID list. The initial workspace scripts exclude the full catalog and nine-level primer data. The header ignores unrelated store changes, and the editor and results panel reuse their views during timer ticks.

Offline installation caches core pages, initial assets and self-hosted fonts, then caches other features as they are visited. The precache fell from 88 files to 43, saving approximately 1.2 MB of asset downloads before compression. Offline refresh passed after the cache change. Workspace links also avoid automatically fetching other routes.

The redesign's mobile Lighthouse measurements use three runs per page. They predate the follow-up route hydration and development worker fix; performance was not remeasured for that focused change. The performance target is met by the median; the workspace still had one run below 90.

| Page | Median performance | Performance range | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: |
| Landing | 94 | 93-96 | 100 | 100 | 100 |
| First problem workspace | 91 | 85-94 | 100 | 100 | 100 |

Raw runs, CPU benchmark values and the median selection are retained in [the performance report](../artifacts/performance-summary.json). The median reports are [landing](../artifacts/final-lighthouse-landing.json) and [workspace](../artifacts/final-lighthouse-workspace.json). The measurements use the local gzip static server, default mobile throttling and a quiet test schedule; other applications on this shared machine still affect the CPU benchmark. Scores describe local measurements, not a guarantee for every device or host.

## Night contrast and sidebar

| Requested comparison | Before | After | Target |
| --- | ---: | ---: | ---: |
| Empty heatmap cell / surface | 1.35 | 3.57 | 3 |
| First intensity / surface | 1.57 | 4.82 | 3 |
| Second intensity / surface | 2.68 | 5.85 | 3 |
| Offset shadow / page | 1.11 | 3.12 | 3 |
| Active key border / mustard | 1.25 | 9.71 | 3 |
| Muted text / raised surface | 5.42 | 4.87 | 4.5 |

Paper's palette is retained. Night has distinct warm surface steps, visible borders and offset shadows, and readable disabled controls. The shared sidebar uses 14 px navigation labels, at least 12 px secondary text, 20 px icons and 44 px rows. Active links have a thick marker, bold text and aria-current. Collapsed tooltips, readable locks, internal scrolling, reachable profile controls and the mobile menu are implemented in shared components.

The wordmark's block cursor is static. Skeleton pulse and the Monaco editing caret retain their separate behavior. Native scrollbars use tokens in both themes, and Monaco receives matching slider colors.

## Screenshots and machine reports

| View | Evidence |
| --- | --- |
| Night dashboard | [Before](../artifacts/v5-before-night-dashboard.png), [after](../artifacts/final-night-dashboard.png) |
| Night landing | [Before](../artifacts/v5-before-night-landing.png), [after](../artifacts/final-night-landing.png) |
| Night Path | [Before](../artifacts/v5-before-night-path.png), [after](../artifacts/final-night-path.png) |
| Paper dashboard | [Final](../artifacts/final-paper-dashboard.png) |
| Centered dialogs | [360 px Night](../artifacts/final-dialog-360-dark.png), [1,280 px Paper](../artifacts/final-dialog-1280-light.png) |
| Actual 200% zoom | [Night, 360 px physical width](../artifacts/zoom200-Night-360.png) |
| Live editor themes | [Night](../artifacts/final-editor-dark.png), [Paper](../artifacts/final-editor-light.png), [checks](../artifacts/editor-audit.json) |
| Browser results | [Playwright](../artifacts/playwright-final.json), [Axe and overflow](../artifacts/ui-audit.json), [zoom](../artifacts/zoom-200.json) |
| Data checks | [Contrast ratios](../artifacts/contrast.json), [initial workspace assets](../artifacts/workspace-initial-assets.json), [runtime preservation](../artifacts/preserved-runtime-audit.json) |

Artifacts are local and ignored by source packaging.

## Runtime and publishing limits

Iwons remains browser-only, with no application backend or database. Personal work stays in versioned local storage. Migration preserves the original v1/v2 namespaces and exports portable archives. Watch is opt-in and local; it cannot see other websites, applications, screens or devices.

Native Java reference validation covers all 500 exercises. The live Java runtime remains **Beta and unconfigured** until an explicitly supplied Judge0 endpoint is verified. Python's first browser run requires its runtime download. Headless visibility events are made deterministic in the automated Watch test; paste, presence, fullscreen, workers and editor interactions use actual browser APIs. WebKit smoke coverage is not a full certification of Safari or Firefox. External structured-data validation and Search Console submission need a final published domain.

The previous Vercel deployment request returned **403** because the connected account lacked access to the linked `snowis-projects` scope. No deployment URL was returned. This continuation does not claim the site is published. The source and production `out/` export are available in this workspace.
