# Foundations v2 reconciliation

2026-10-16. The user authorized continuous implementation, superseding routine review pauses. Runtime honesty, dependency approval and data preservation still apply.

| v1 section | State | Evidence |
| --- | --- | --- |
| A. Track | Partial | Java-only types exist; no published course |
| B. Structure | Missing | No manifest or course content |
| C. Module anatomy | Partial | Types/validators exist, no authored modules |
| D. Runner | Partial | Java program transport exists but live endpoint is unavailable; existing function/operations workers retained |
| E. Model/storage | Done for infrastructure | v4 migration and isolated progress, backup compatibility tested |
| F. Routes/screens | Missing | No Learn routes, navigation or landing entry |
| G. Original content | Partial | Blocklist/validator infrastructure; no Foundations content authored |
| H. Safe production | Partial | Runtime/content gates respected; synthetic fixtures only |
| I. Human languages | Partial | Preference and English fallback; no translated lessons |

## Exact visibility diagnosis

No courses were hidden. Earlier authorization explicitly kept lessons gated and implemented infrastructure only. There was no `src/data/foundations.json`, no `src/app/learn/`, no Learn sidebar entry, and no landing-course links. Consequently there were no Foundations static params or sitemap entries. Neither persisted settings nor a language/status filter nor stale service-worker state caused this absence. `/problems` contains the existing 500 Path problems; no Foundations exercises exist to include.

Existing files retained: `src/lib/foundations/{types,translations,progress,validate,validate-progress}.ts`, `scripts/validate-foundations.ts`, `src/lib/migrations/v4.ts`, `src/components/settings.tsx`. Existing `/path`, `/path/[level]` and `/problems/[slug]` remain unchanged in meaning. No live Foundations URL needs migration or redirect.

## Runtime baseline

Java: dedicated worker/Judge0 transport, explicitly unconfigured. Hello World, Scanner and multiple-class live checks have NOT passed. `javac 23.0.2 --release 8` is available for native fixtures but is not a browser execution service. Local Judge0 requires more disk than the roughly 1.4 GiB available; no downloads will be retried without capacity. Java content remains gated.

Initial JavaScript/TypeScript state: dedicated worker, function and operations harnesses. The TypeScript compiler was already installed, so no dependency was needed. Python is pinned to Pyodide `v314.0.7`. The subsequent live browser check reported **Python 3.14.2**, matching local `python --version`; it was not inferred from the package label. Node is 24.16.0 (recorded in `.node-version`), and installed TypeScript is 5.9.3. Additive program mode now passes real browser Hello World and stdin probes in JavaScript, TypeScript and Python. Java operations transport exists but cannot be verified live without its endpoint. Do not claim all-track operations verification.

## Structure, route budget and plan

Use the existing proposed manifest path `src/data/foundations.json`, extended to schema 2. Publish course/module maps from structure even while all lessons are planned. CP1 12 modules, CP2 12, DSA 20; four proposed lessons per module gives 176 lessons. Four tracks yield 704 English lesson URLs; three human languages would yield 2,112 lesson URLs plus 579 hub/course/module URLs and exercises. Only ready lesson bodies enter static params/sitemap. Do not generate untranslated locale routes or claim planned content is ready.

Order: visibility rescue and static maps; v2 types and v5 data migration; track controls and diagnostics; additive program runtimes and real browser smokes; deterministic accessible visualizer engine; validators and reciprocal DSA/Path links. Curriculum authoring remains subject to the live Java gate. Planned/draft stations stay visible throughout, with no executable content invented to bypass the gate.

## Design

Reuse Part 7 tokens exclusively: Paper/Night surfaces, ink rules, accent-2 folder tabs, existing display/body/code fonts. Course maps use a manual's contents sheet with punched station numbers and Coming soon stamps. Align titles and lesson lists left; use borders to show course/module hierarchy. No new palette, font, dependency or sidebar reconstruction.
