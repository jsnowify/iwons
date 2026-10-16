# Performance-pass decisions

The 2026-10-16 removal brief replaces earlier course plans. Full historical code and documentation are preserved on archive/learn-v1 (63b10c1).

No color, font or layout token changes. No new runtime dependencies. English UI only; unused legacy stored preferences remain compatible.

| Date | Decision | Reason | How to reverse |
| --- | --- | --- | --- |
| 2026-10-16 | Archive full current Learn before removing it | Nothing permanently lost | Restore selected files from archive/learn-v1, applying English-only page budget |
| 2026-10-16 | Keep output export and trailing slashes | Browser-only static architecture | Explicit future hosting change |
| 2026-10-16 | Host-config redirects plus local preview equivalents | Export has no runtime redirects | Transfer rules to another static host |
| 2026-10-16 | Keep storage versions/migrations/archive records | No personal data loss or broken backups | Restore feature without rewriting stored IDs |
| 2026-10-16 | Production metadata default, no VERCEL_URL | Live source confirms preview-domain leakage | Set NEXT_PUBLIC_SITE_URL for a new production domain |
| 2026-10-16 | Benchmark a unit through its level-page anchor | No standalone unit route exists | Benchmark a real route if later introduced |
| 2026-10-16 | Isolated owned dev benchmark caches; leave user dev running | Avoid hot/cold cache mixing and workspace disruption | Stop only owned processes and clean verified temporary paths |
| 2026-10-16 | Reapply export postprocessing before browser baseline | Inspected output contained cleanup worker and dev output; postprocessing fixes production worker/404 behavior | Preserve equivalent postprocessing in revised pipeline |
| 2026-10-16 | Remove active courses and locale UI, retain compatibility-only v4-v6 schemas | Preserve backup import/export and original namespaces without shipping course content | Restore from archive/learn-v1 |
| 2026-10-16 | Move Warm-up to existing Path SRS and Visualizer to an on-demand standalone tool | Keep reusable engagement after course removal | Restore archived wrappers |
| 2026-10-16 | Remove one obsolete generated dev route type before rebuilding | Deleted source left stale Next-generated imports; fresh build regenerates current route types | Regenerate with Next |
| 2026-10-16 | Bottom audit before layout edits: 80 route/width/theme observations; 70 lack a footer, only homepage has one; zero horizontal overflows | Shared footer missing on seven main route views; problem workspace uses bounded inner scroll regions | Before screenshots and JSON in artifacts/bottom-layout/before.* |
| 2026-10-16 | Keep individual problem OG images with content-hashed filenames and stable compatibility aliases | Retains problem-specific social previews; recurring build skips Satori for unchanged content | Restore archived route handler |
| 2026-10-16 | Cached filesystem catalog with route-specific metadata props; related selection on server | Removes full catalog JSON from client module graph; curriculum already read by scripts only | Restore imports from archive |
| 2026-10-16 | Use Turbopack for dev and production on Next 16.4.1 after successful export | No custom webpack requirement; measured fresh requests succeed | Switch scripts to --webpack |
| 2026-10-16 | Build disposable workers with esbuild as a development-only dependency | Turbopack emitted raw worker TypeScript from new URL; independent ESM worker supports both bundlers and lazy strict compiler | Restore webpack worker URL and remove build helper |
| 2026-10-16 | Explicit webpackBuildWorker and four export workers; CI caches .next/cache | Worker was already default for webpack; retain supported fallback and avoid excessive parallel memory | Remove experimental options and workflow cache |
| 2026-10-16 | Keep remaining dependencies after manual import scan | Monaco, Sucrase, Zustand, icons and styling all have active consumers | Re-audit when features change |
| 2026-10-16 | Retain Next-generated AGENTS documentation block | Confirmed generate-agent-files.js adds version-matched documentation guidance | Next dev regenerates it |
| 2026-10-16 | Explicit editor activation with saved-code preview; runners only on Run and Visualizer only on Open | No Monaco/runtime requests on first problem view, confirmed in browser | Restore desktop eager activation |
| 2026-10-16 | Keep all existing font families/weights, Latin subsets and swap | Every family has an active token role; optional fonts already do not preload | Re-audit actual usage |
| 2026-10-16 | Remove eager offline download of every font and defer production offline install 2.5s | Reduce competition with first-view route/fonts; offline still available after registration | Restore immediate registration/precache |
| 2026-10-16 | Stable stamp grid and equal level-access skeleton height | Lighthouse attributed Progress CLS to stamp reflow; level skeleton previously shifted content | Restore prior styles |
| 2026-10-16 | Exclude generated public/out assets from TypeScript source checking | Static compiler libraries and exported assets are not application source | Remove exclusions |
| 2026-10-17 | One Footer instantiated in root server layout and passed through Shell as markup | Same semantic bottom across all pages, no additional client component or dependency | Remove root footer slot and restore archived landing footer |
| 2026-10-17 | Flex-column 100dvh shell, main flex 1, mobile bar/safe-area reserve and existing Tailwind spacing scale | No Iwons spacing tokens existed; reuse existing --spacing without changing any tokens | Restore prior layout styles |
| 2026-10-17 | Normal problem document flow, natural-height output, wrapping tabs and long identifiers | Removes bounded-pane double scrolling and fixes actual 360px text overflow | Restore bounded workspace styles |
| 2026-10-17 | Footer geometry waits for fonts and allows one-pixel browser rounding | Tests final layout while keeping explicit viewport/content/nav edge checks | Tighten tolerance if browser rounding changes |
| 2026-10-17 | Remove remaining translation-review document; preserve it in archive branch | Final scan found an overlooked obsolete translation plan | Restore from archive/learn-v1 |
| 2026-10-17 | Credit Snowi at end of About and in shared footer, portfolio link only | Names the creator with existing retro styling and no personal contact details | Remove About credit and footer credit text |
| 2026-10-17 | Deterministic local-day fallback rotation for Warm-up, due cards first and at most three unique known problems | Initial prefix sort accidentally repeated alphabetical cards; three behavior tests cover due/retired/solved/daily contracts | Restore previous queue selection |
| 2026-10-17 | Keep Java unavailable without an explicitly configured endpoint | No endpoint exists; browser smoke checks honest configuration failure, not simulated Java execution | Configure and independently verify a real endpoint |
| 2026-10-17 | Browser helpers wait for either explicit editor opener or already-opening mobile editor | Code & results itself activates the editor, so the opener is intentionally absent then | Update helpers if editor activation changes |
| 2026-10-17 | Aggregate input hash guard skips the OG generator entirely when inputs/files are unchanged | Makes ordinary builds run a cheap integrity check without invoking Satori or the generator | Run scripts/build-og.mjs directly or remove guard |
| 2026-10-17 | Delete only verified obsolete production webpack cache directories | Production now uses Turbopack; no development cache or user storage was removed | A webpack production build recreates them |
| 2026-10-17 | Keep standard .next/cache path and cache it in CI | Supports Next build reuse without changing hosting or introducing runtime infrastructure; remote Vercel cache not measured | Remove CI cache step |
| 2026-10-17 | Keep optional stamp font unpreloaded after a loading-priority trial | No consistent performance benefit justified adding another initial font preload; token families/weights unchanged | Set Special_Elite preload:true and remeasure |
| 2026-10-17 | Discard verification that overlapped an export; final build and browser suite run sequentially | Export files must stay stable while the browser reads them; final controlled build and all 44 tests pass | No change to application behavior |
| 2026-10-17 | Set public site-URL example to the production origin too | Copying the example should not publish localhost canonicals | Set NEXT_PUBLIC_SITE_URL explicitly for a custom domain |
| 2026-10-17 | Retain measured LCP/TBT gaps in final report | Lab targets must not be presented as universal successes; no field percentile or deployment was measured | Profile and measure a subsequent performance change |

| 2026-10-17 | Restore default prefetch for shared navigation and landing shortcuts | Explicit false forced destination data to start at click; Next schedules visible routes and reuses the shared layout | Disable only specific measured expensive links |
| 2026-10-17 | Remove footer creator credit; retain About credit | Latest explicit user instruction overrides the earlier footer brief | Restore Footer paragraph |
| 2026-10-17 | Send only Path map fields and memoize problem filter inputs | Avoid unused primer/example serialization and repeated full-list work | Restore full level props and eager derivations |
