# Foundations v2 implementation record

See `FOUNDATIONS-V2-AUDIT.md` for the initial diagnosis and route budget. The user's instruction to continue supersedes routine phase approval pauses. It does not make an unavailable Java service operational.

## Visibility and structure

The site now has a manifest-backed Learn hub, four track hubs, CP1/CP2/DSA course maps and 44 module maps. `src/data/foundations.json` is schema 2 with four planned lessons per module (176 total). Seed source is `scripts/seed-learn.mjs`, invoked by `scripts/seed.mjs` and `npm run seed`. No former live Foundations URL existed, so there is no legacy course redirect to add.

The sidebar Learn link and CP1/CP2/DSA shortcuts precede the Path. Landing keys link to CP1, DSA and the Path. Maps show ready counts and separate learner progress, never hide planned stations, and never expose them as clickable lessons. The hub has a reload recovery state and an error boundary. A direct planned lesson URL gets a Learn-specific explanation and module-return link after hydration of the static 404 document.

Folder links switch code tracks while retaining the course/module location. Settings and onboarding save `codeTrack`; existing favorite languages migrate into it. A separate human-language picker saves English/Tagalog/Bisaya. Maps currently use English and explicitly explain missing translations. No fabricated translated URLs or hreflang links exist.

`/dev/content` is development-only and noindex; production returns 404. It reports structure validation, per-track statuses and human-language availability. Sitemap entries include existing map URLs only; no planned lesson URL is indexed.

## Data and rewards

Active namespace is `iwons:v5:`. Original v1–v4 keys remain intact. v4 Foundations reads/solves/checkpoints move to Java, with independent empty progress in the other tracks. v1–v5 backup import/export and quota-failure recovery are retained. Existing Path data and unlock logic are preserved.

The pure reward helper awards one full exercise value plus 25% for each additional solved track, per-track module/course stamps and Polyglot course recognition. No new curriculum exercise has been published, so this helper does not add unearned rewards to existing Path totals.

## Runtimes and workbench

`/learn/runtime` executes real worker probes rather than simulating results. Program mode is additive to existing function/operations modes. JavaScript and TypeScript provide UTF-8 `require('fs').readFileSync(0, 'utf8')`, virtual text files and readline line/close events plus async iteration. This is an explicitly limited teaching shim, not the full Node platform. Python program input uses `sys.stdin`; output is captured from the actual interpreter, whose version is returned in results. The browser reports **Python 3.14.2**, matching the local interpreter. Pyodide keeps its in-worker filesystem.

Strict TypeScript diagnostics use the already installed TypeScript 5.9.3 compiler, lazy-loaded in the dedicated worker with self-hosted library declarations. Run can continue with warnings; submission checks return Compile Error with line-numbered diagnostics. No dependency was added. Existing Path TypeScript behavior is unchanged.

`/learn/visualizers` contains deterministic binary-search, insertion-sort and grid-BFS frame generators plus a reusable accessible controller. Controls include Play/Pause, forward/back, Reset and Speed; keyboard arrows/Home/End work on the board. Reduced motion disables playback; manual stepping remains available. No animation starts automatically.

DSA module practice references use actual unit IDs from the 500-problem manifest. Both directions use the same mapping. Solved counts come from existing client-side Path progress; Path problem content and unlocking are unchanged.

## Explicit remaining gate

| Brief phase | Current state |
| --- | --- |
| V0 | Visibility rescue complete and browser-tested |
| V1 | Planned manifest, multi-track types and v5 migration implemented |
| V2 | Hub/course/module maps, controls, diagnostics and planned states implemented; ready lesson/exercise bodies remain pending |
| V3 | JavaScript/TypeScript/Python program probes pass; Java live service blocked |
| V4–V5 | CP1/CP2 authoring blocked by the required live Java gate |
| V6 | Visualizer engine and first three previews implemented; authored DSA lesson template/build exercises pending |
| V7 | DSA authoring pending the runtime/content gate |
| V8 | Map metadata and regression checks implemented; translated lesson routes and content-derived playbook pending |

Java is still unconfigured. Its Hello World, Scanner and two-class probes cannot pass without a user-controlled Judge0 endpoint. Local setup previously exhausted C:; the final check has about 1 GiB free, below the 20 GiB setup guard. Native `javac --release 8` fixtures do not meet this browser-runner gate. Java filesystem support is unverified.

Therefore CP1/CP2/DSA lesson bodies, exercises, checkpoints, answer packs, translated lesson routes, content-derived pattern cards and full multi-track reference/example validation remain unfinished. `validate:foundations` and `validate:dsa` currently certify planned structure and Path references only and explicitly report that authored-content execution is gated; they refuse ready v2 content through this structure-only path. They do not pretend planned lessons passed execution tests.

The three visualizer previews are available for review independently of the gated course bodies. Do not relabel this implementation as a complete taught curriculum or a working Java runtime.

## Browser verification

All 30 browser regressions passed in 2.9 minutes, including actual JavaScript/TypeScript/Python Hello World and stdin, TypeScript Run warnings versus blocked submission, explicit Java unavailability, Learn visibility in every track, saved preferences, migration/export/restore, direct planned-lesson recovery, production diagnostics 404, reduced-motion stepping and existing Path/Watch/hydration/sidebar flows. Report: `artifacts/learn-v2-playwright.json`.

The browser pass identified missing decorator declarations in the exported TypeScript standard library. Asset preparation now copies the full existing declaration set; unit diagnostics test the actual shipped declarations. Library-load failures return an explicit Compile Error. A corrected targeted browser run passed before the complete suite.

The final 1,338-entry build includes the exact browser-confirmed runtime labels. The new hub, module map and visualizer workbench passed 18 Paper/Night Axe scans at 360/768/1280 px, with zero violations, overflows or page errors. See `artifacts/learn-v2/a11y.json` and the adjacent screenshots. The running development server also serves Learn and content diagnostics correctly; the production export removes diagnostics files so plain static hosts return a real 404.

The final hub visibly marks the saved default track. New Learn links disable automatic prefetch, and the final visibility/preference regression passes. Lighthouse mobile scores are 96 performance, 100 accessibility, 100 best practices and 100 SEO (`artifacts/learn-v2/lighthouse.json`). The benchmark uses a managed Chromium session to avoid Windows temporary-profile cleanup problems in the CLI; the final audit exits successfully. No audit dependency was installed.
