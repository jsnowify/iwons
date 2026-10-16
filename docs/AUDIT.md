# Foundations and learning engine audit

2026-10-16. Read alongside PROGRESS.md for current completion, and FOUNDATIONS-V2-AUDIT.md for historical evidence. The latest brief supersedes the earlier Java content gate.

## Reuse and gaps

| Area | Current evidence | State / next work |
| --- | --- | --- |
| Visibility | `/learn`, four track maps, three courses, 44 modules / 176 planned lessons; shared sidebar and landing links | Visible; eliminate abbreviations and short course URLs |
| Routes/data | Build-time manifest loader with explicit retry state, 193 map paths; no ready bodies | Retain; build ready lesson rendering and lazy keys |
| Course content | No authored lessons/exercises/translations | Missing, never mark maps ready to imply content |
| Storage | Version 5, v1–v4 backups/migrations, per-track Foundations progress; originals archived | Reuse and add one validated learning-engine migration |
| Runners | Dedicated terminated workers, stdout/stdin; JavaScript/TypeScript virtual fs; Python exact 3.14.2 browser probe; strict TypeScript diagnostics | Retain; Java fallback notes and local execution validation |
| Java | Native JDK 23.0.2 supports `--release 8`; browser Judge0 URL absent | D1 author locally; browser remains unavailable |
| Versions | Node 24.16.0; TypeScript 5.9.3; Pyodide v314.0.7 / Python 3.14.2 | Pin and assert validators |
| Review scheduling | `src/lib/srs.ts`: five expanding day intervals and four ratings, keyed by Path problem | Extend for concept/track recall and same-session retry |
| Hints/notes/Watch | Existing local hints and notes; opt-in integrity observer | Reuse; Explain and recall never integrity inputs |
| Rewards | Existing Path XP and v2 pure cross-track helper | Add actual recall/module event integration |
| Visualizer | Deterministic binary search, insertion sort, grid breadth-first search; keyboard/reduced-motion | Add prediction; retain engine |
| Big-O | Existing Path exercises/primers | Add lesson-level self-check without changing Path content |
| SEO | Static export, metadata, sitemap; Course data | Exclude planned modules from indexing; descriptive titles/URLs; real locale alternates only |
| Fonts/design | Existing local fonts and Part 7 tokens already used in Tagalog/Bisaya UI; no new font needed | Verify rendered translation samples and zoom |
| Diagnostics | `/dev/content` dev-only; production output removed postbuild | Add learning-engine quality and authored-content counts |

## Visibility diagnosis

Historical absence was missing manifest/routes/navigation while authoring was gated, not a persisted filter or stale state. Current maps render from the manifest, independent of content status and personal progress. Every track has a module map. Planned lessons remain nonclickable. There are no Foundations exercises to list in Problems yet. Preserve the explicit missing-manifest retry and Learn-aware 404.

## Build and content budget

Baseline before this brief: 1,338 build entries, approximately two minutes including checks on this machine. Full English lesson matrix is 704 paths; all-human-language matrix is 2,112 lesson paths plus maps/exercises. Apply D4 as recorded; measure phase builds. Current disk space about 1.1 GiB rules out Docker downloads. Existing static files and dependencies are retained.

Ready lesson minimum: 250 prose words, split into segments of at most 150 words; 5–10 minute target with at least three distinct interactions, PRIMM stages, error challenge and recap. Module intro 150–250 words. Validators must execute all runnable examples/reference cases using real local runtimes; structure-only validation must never approve content.
