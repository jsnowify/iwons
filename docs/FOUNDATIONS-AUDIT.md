# Foundations pre-implementation audit

## Continuation: infrastructure authorized

The user subsequently chose **“Build infrastructure; keep lessons gated.”** The content-independent implementation now includes types, translation fallback, concept-order/content validation, separate progress, a lesson-language setting and storage edition 4. Original v3 data remains preserved; earlier schema descriptions below record the initial audit. See [the completed infrastructure slice](FOUNDATIONS-INFRASTRUCTURE.md).

No Foundations manifest, curriculum or learning routes have been generated. Live Java remains unconfigured; the three browser-worker probes have not passed. Local setup remains blocked by roughly 1.4 GiB free on C:, below the setup guard. Native validator fixtures do not satisfy the live runtime gate.

Initial audit on 2026-10-16 against the supplied Foundations brief. At that initial step only documentation changed; the continuation above records subsequent authorized infrastructure work.

## Java readiness

Java currently executes remotely through an explicitly configured, CORS-enabled Judge0 CE endpoint. `src/lib/runners/index.ts` starts the dedicated `public/runners/java.worker.js` worker and terminates it after 60 seconds. The worker discovers a Java language ID, submits source, polls and returns structured results. CheerpJ is unavailable. There is no working browser-only Java compiler bundled with Iwons.

The default endpoint in `src/store/use-store.ts` is empty. An existing user's endpoint, if any, is stored in that browser's settings; this audit has not inspected their browser profile or contacted an execution service.

The current Java path is a function/operations harness, not a whole-program runner. It wraps user source in `JavaHarness.txt`, supplies its own `Main`, and sends a JSON RunRequest as stdin. The harness's Scanner consumes that JSON. This does **not** establish support for a learner's `Scanner(System.in)` input. RunRequest has no program mode or stdin field, and worker output must be harness JSON rather than arbitrary stdout. A learner-supplied `public class Main` would conflict with the existing harness.

Therefore Hello World, learner Scanner input and a two-class program have **not passed the requested live runner checks**. Previous local Java curriculum checks do not substitute for them. Do not generate exercises or describe Java as ready on that basis.

Fallback: use the existing optional Judge0 integration, adding an isolated whole-program path with raw stdin, stdout comparison and explicit Java 8 compatibility checks. Preserve existing function and operations modes. No backend is added to Iwons itself. A user-controlled endpoint must be configured and the three actual browser-worker probes must pass before content generation proceeds. Java language discovery alone does not verify the compiler version or `--release 8` support.

The local compiler is `javac 23.0.2`; reference validation must explicitly use `javac --release 8`. This audit only checked the installed version, not the three runtime probes. No virtual filesystem exists. File lessons must remain read-only with a local-computer guide unless the selected execution service's isolation and file support are verified.

## Existing content and workspace

- `src/data/curriculum.json` describes the 500 Path exercises; `catalog.json` is the public summary index.
- Source problems are in `src/data/problems/level-N/unit-slug/slug.json`. `scripts/seed.mjs` produces indexes, private packs and validation inputs.
- `src/lib/problems.ts` removes private data, reference solutions and worked examples before returning a problem to the page.
- `/problems/[slug]` uses static params, `dynamicParams = false`, server-rendered descriptions, canonical metadata and LearningResource/Breadcrumb JSON-LD. Hidden cases and editorials are separate lazy packs in `public/problem-data/`.
- Foundations needs a separate course/module/lesson model and a Java-only exercise representation. The current Problem requires four-language starter code and a Path level; simply inserting Foundations entries into the Path catalog would mix counts, gates, search and rewards. Keep those selectors explicitly scoped and preserve all existing problem IDs and URLs.
- The existing `operations` runner mode must survive the addition of `program`; do not replace the current union with only `function | program`.

## Storage and settings

All application localStorage access is centralized in `src/lib/storage.ts`. Active data uses `iwons:v3:`; v1/v2 namespaces and resolved legacy archives support migration and backup compatibility. The Zustand adapter persists the named `DATA_KEYS` individually, skips initial hydration, merges settings defaults and writes through storage.ts. Import validates its envelope and restores the previous data if writing fails.

Foundations should introduce a v4 migration that **copies all active v3 Path data without retiring or resetting it**, adds separate lessons-read/exercises-solved/checkpoint-score data and defaults `settings.lessonLanguage` to `en`. Extend import validation, namespace enumeration, exports, rollback and v1/v2/v3 compatibility together. Existing settings.language chooses the programming language; lessonLanguage is a separate setting. Retain the existing Taglish preference outside Foundations.

Practice Watch must remain opt-in and local. Foundations must force practice behavior and exclude contest banners and contest submission paths. Its course/module stamps and exercise XP must not change Path unlocking requirements.

## Navigation, static routing and SEO

`src/components/sidebar.tsx` owns shared navigation; `shell.tsx` derives its structure from rendered layout segments. Add Learn before The Path and localize its visible label, landing keys and Foundations breadcrumbs. Preserve the hydration fix and the mobile menu.

Next is configured for a static export with trailing slashes. The current root layout hardcodes `<html lang="en">`. Correct server-rendered `fil` and `ceb` pages require locale-aware root layouts, while keeping existing English URLs unchanged. A nested `<html>` or a client-only language mutation would not meet the brief. Next's installed layout documentation permits multiple root layouts and documents full page loads when crossing them; plan and test that boundary explicitly.

New learning routes need static params, per-language canonical/hreflang metadata, sitemap coverage and Course/LearningResource JSON-LD. Keep answers, correct-option indexes and hidden/reference packs out of HTML **and serialized client props**, in every language. The shared exercise URL stays unprefixed with client-selected translated statements; translated lesson/module pages carry the indexable localized content.

## Fonts and design

The requested frontend-design skill has been read. Use the existing Paper/Night tokens, Courier Prime body, Fraunces display, Special Elite stamps, JetBrains Mono code and Geist readable setting. Retain the existing numbered Path board vocabulary for module stations; no new palette or typeface is needed.

A Chromium font inspection on the already-built app rendered `ñÑ áéíóúÁÉÍÓÚ üÜ ng Ng` in each of the five families. Each reported only the requested custom font, with no fallback font. Evidence: `artifacts/foundations-font-audit.json`. This covers these sample glyphs, not every future translated sentence. Longer translated navigation and module text still need mobile/zoom, keyboard and both-theme verification once content exists. Normalize translated prose to NFC.

## Estimated static size

For planning only, assume 100 exercises per course and four lessons per module. Exact lesson and exercise allocation belongs in the manifest approval step. The 24 checkpoints add 120 questions, not 120 separate routes.

| Addition | HTML files |
| --- | ---: |
| Learn home, two course maps, 24 module pages and 96 lessons | 123 per language |
| English, Tagalog and Bisaya learning routes | 369 |
| Shared exercise URLs, 200 exercises | 200 |
| Total added HTML | 569 |

The current export contains 638 HTML files and the build reports 1,142 prerender entries, including non-HTML outputs. This plan gives approximately **1,207 HTML files**. Retaining one existing-style social image per new exercise adds 200 image outputs, giving approximately **1,911 prerender entries** on the same counting basis. If each module needs six lessons instead, estimates become 1,351 HTML files and 2,055 entries. Checkpoints and scratch work are assumed to reuse their host page/workspace, with no additional routes.

These are size estimates, not measured build-time promises. Measure the first module's build and compare the final manifest projection before changing the requested static localization approach.

## Review gate and next steps

The latest brief explicitly says: “Start with a short audit and report … Wait for my OK.” This document is that reviewable audit; no permission requirement comes from the design skill.

After audit approval, run the three requested probes through the actual Java runner and report the results. If the runner cannot pass, stop before generating content and resolve the configured Judge0/program-mode fallback. Only after the runtime gate passes, create `src/data/foundations.json` for separate approval. Then produce CP1 modules 1–12 and CP2 modules 1–12 in order, with English approval before each module's draft translations and module approval before proceeding.

Later implementation checks must include concept-order validation, Java 8 compilation and all cases, translated structure parity, answer-pack privacy, v4 migration/backup compatibility, existing Path regressions, typecheck, tests, `npm run lint` and `npm run build`. Translation review must explicitly require native-speaker review, especially for Bisaya. No application checks were rerun for the initial documentation-only audit; the previous build and test results do not certify Foundations.

## Java gate results after audit approval

The user approved continuation. `scripts/check-foundations-java.mjs` now runs the three probes in real browser workers, using the shipped `/runners/java.worker.js`, with no mocked execution service. The report is saved to `artifacts/foundations-java-gate.json`; exit status 1 means the gate did not pass.

| Probe | Result |
| --- | --- |
| Hello World with `public class Main` | Blocked: no Judge0 endpoint supplied |
| Scanner reading `7` from stdin and printing `14` | Blocked: no Judge0 endpoint supplied |
| Main plus a non-public Receipt helper class | Blocked: no Judge0 endpoint supplied |

All three were rejected before compilation or execution. No external judge was contacted. These results verify the existing unavailable-runtime guard; they do not establish whether a particular Judge0 installation supports the examples. The existing harness also still needs additive whole-program handling before these probes can succeed.

To repeat against an explicitly supplied endpoint, start Iwons locally and run in PowerShell:

```powershell
$env:IWONS_BASE_URL = 'http://localhost:3000'
$env:IWONS_JUDGE_URL = 'https://your-judge-host'
node scripts/check-foundations-java.mjs
```

The endpoint is not persisted by the probe. Source and test input are sent only to that configured service. No Foundations manifest, lessons, exercises, translations or storage migration have been generated. Keep file lessons read-only until file support is separately verified.

The user asked for automatic service setup rather than supplying an endpoint. Docker Desktop was available but stopped; it was started for a local setup attempt. The default Judge0 image requires cgroup v1 while this engine uses v2. A separate local-service configuration is prepared in `tools/java-runtime/`, using upstream Isolate 2.2.1 and a dedicated cgroup subtree. The image download exhausted the system drive before a service could be built. Its downloaded images, identified build cache and interrupted pull leases were cleaned up, followed by filesystem trim. Docker Desktop was stopped; its existing welcome container was preserved. Remaining virtual-disk compaction needs Administrator privileges, unavailable in this coding session. The setup now checks for at least 20 GiB free before downloading. See [the runtime status and recovery steps](../tools/java-runtime/README.md).

The Java worker now has additive program-mode transport, raw stdin, Java 8 compiler options and stdout normalization. Function/operations retain the existing JSON harness. Four isolated worker tests cover the new transport, whitespace rules, compiler/time-limit results and preservation of old modes. These use mocked transport responses and **do not count as live Java verification**. No runtime endpoint has been enabled in settings, and the three live probes remain blocked. The manifest/content gate therefore remains closed.

Validation after these changes: typecheck and ESLint passed; all 532 unit tests passed; the production build generated 1,142 entries and verified all 500 existing problem exports; three targeted browser regressions passed in 14.4 seconds. The recovery PowerShell script passed syntax parsing; its privileged compaction commands were not executed. The disk preflight was exercised and refused setup at less than 1 GiB free. The three live probes were repeated after the worker change and still stopped at the missing-endpoint guard.
