# Continuous Foundations build

Updated 2026-10-16. Source brief: attachment 2b108da3-596e-46fd-9754-a2793b3f9d8d. Earlier implementation is retained; readiness requires execution and review, never just a populated map.

Current phase: V4. The first-module pilot passed its content, native, build, independent review and mounted-browser gates. V0–V2 baseline build and browser checks passed. The latest repeated brief (8986d257-03d8-4633-b0ea-a07df4ee1903) has the identical SHA-256 as the original; no requirements changed.

| Phase | State | Remaining |
| --- | --- | --- |
| V0 Audit and visibility | Done | Refreshed AUDIT.md, DECISIONS.md and this ledger; maps visible |
| V1 Models and migration | Partial | Engine types and storage 6 migration implemented; content execution / i18n validators in progress |
| V2 Hub and routes | Partial | Full names, descriptive URLs, redirects, ready-only sitemap and session entry done; locale maps still needed |
| V3 Runners | Partial | Three browser workers passed; Java endpoint unavailable, use D1 local validation |
| V3b Learning engine | In progress | Core interactions and short-session flow verified on samples and pilot; rewards, challenge codes and shuffle remain |
| V4 Computer Programming 1 | Planned | First module passed; remaining 11 modules in English four tracks, then two draft translations |
| V5 Computer Programming 2 | Planned | All 12 modules, same gates |
| V6 Algorithm engine | Partial | Three visualizers exist; prediction mode, Shuffle Drawer |
| V7 Data Structures and Algorithms | Planned | All 20 modules, same gates |
| V8 Playbook, SEO, accessibility | Partial | Full curriculum and engine verification |
| V9 Path learning features | Planned | Additive only; no content or unlock changes |
| VZ Final verification | Planned | All validators, review defects, final report |

## Counts

| Course | Modules planned / open | Lessons planned / written / ready | Exercises written | Recall cards |
| --- | --- | --- | --- | --- |
| Computer Programming 1 | 12 / 1 | 48 / 4 / 4 | 9 ready | 12 ready |
| Computer Programming 2 | 12 / 0 | 48 / 0 / 0 | 0 | 0 |
| Data Structures and Algorithms | 20 / 0 | 80 / 0 / 0 | 0 | 0 |

Written counts apply separately to Java, Python, JavaScript and TypeScript in English. Tagalog and Bisaya remain unwritten. The first module passed its review and rendered checks. The first Computer Programming 1 module passed a content review gate. Existing 500 Path problems are separate and unchanged.

## Module checklist

Computer Programming 1: [x] Meet the language; [ ] Variables; [ ] Operators; [ ] Input/output; [ ] Decisions; [ ] While loops; [ ] For loops; [ ] Functions; [ ] Arrays; [ ] Strings; [ ] Debugging; [ ] Capstone.

Computer Programming 2: [ ] Two-dimensional arrays; [ ] Classes; [ ] Encapsulation; [ ] Object design; [ ] Inheritance; [ ] Polymorphism; [ ] Interfaces; [ ] Exceptions; [ ] Collections; [ ] Functional style; [ ] Recursion/search/sort; [ ] Files/capstone.

Data Structures and Algorithms: [ ] Algorithms; [ ] Cost; [ ] Arrays/strings; [ ] Hashing; [ ] Sorting; [ ] Pointers/windows; [ ] Prefix sums; [ ] Stacks/queues; [ ] Recursion; [ ] Divide/conquer/search; [ ] Bits; [ ] Linked lists; [ ] Trees; [ ] Heaps; [ ] Graphs; [ ] Union-find; [ ] Tries; [ ] Greedy; [ ] Dynamic programming; [ ] Backtracking/playbook.

## Evidence and blockers

- Existing infrastructure baseline: 568 unit tests, 32 browser tests; last full UI build 1,338 entries. Pattern-strength change additionally passed four focused browser checks, typecheck, lint and production build.
- Current checkpoint: 577 unit tests passed, typecheck and lint passed, production build passed with 1,527 entries including legacy-address fallbacks and Warm-up. Export naming validator passed. All 500 Path references / 54 units passed all four native runtimes through `npm run seed`; content hashes remain consistent.
- Browser checkpoint: all 13 focused tests passed (full names, permanent redirect, maps in all tracks, real JavaScript/TypeScript/Python workers, Java unavailable state, navigation polish and compact Pattern strength). Python reported 3.14.2.
- Engine work since that build: temporary four-track dev sample, PRIMM activity, recall feedback/rating, keyboard/drag Parsons, Close the Book, local learning progress/export, and Visualizer prediction. Typecheck passes. Focused engine/native/migration tests: 23 passed. These newer screens still need a fresh build and mounted browser checks; the dev sample is not a curriculum lesson and does not write learner progress.
- Subsequent engine build passed with 1,529 entries. Static `/design/learning` audit passed all eight track/theme combinations at 360 px: guess, real runs where available, trace, Modify, recall/rating, recap, keyboard Parsons, no page errors/overflow. Java stays offline-only without endpoint. `artifacts/learning-engine/browser.json` records the checks.
- Native engine tests now additionally validate function and operations harnesses in all four local runtimes (11 lesson-template tests passed). New work since that build: checkpoint sample, reusable learning workspace/editor/results, ready-lesson rendering, concept bars, and lesson/example runtime validation. Workspace samples and session flow still need their gates.
- Development verification issue: the original Next dev instance served HTML without mounting controls, and an isolated dev instance stalled before rendering. No learner data changed. The temporary noindex design-system route permits verification against the actual production export; the user dev server was left running. The isolated verification server was stopped.
- Java browser execution has no configured endpoint. This blocks Java browser probes, not authoring under the new D1. Do not retry Docker downloads: C: has about 1.1 GiB available. Local JDK exists.
- Native-speaker review remains pending, with translations explicitly draft when written.
- Existing uncommitted work predates this brief. Preserve it; stage only deliberate changes when committing completed units.

- Latest engine checkpoint: typecheck passed; lint passed after correcting the authoring loader variable name; production build passed with 1,533 static entries and all export checks. Focused engine/native/migration suite passed 29 tests; subsequent authoring/backup suite passed 11 tests. All eight lesson track/theme probes passed including checkpoint; all eight workspace kind/track probes passed including keyboard boundary focus and preview typing. Short-session prediction ? worker run ? exercise submission ? recap passed. Reports: artifacts/learning-engine/{browser,workspaces,session}.json.
- Independent engine re-review found all six original P2 defects fixed at source level. Drafts use existing versioned string keys, retaining backup compatibility. Temporary samples remain excluded from course counts.
- First real module now has four English lessons, nine exercises and twelve recall cards per track as draft seed sources. Native draft validation passed 32 lesson cases and 116 exercise/arrangement cases across all four tracks, plus five checkpoint keys. Review identified trace line labels and a misleading exercise reference; source fixes written, regeneration/revalidation pending. No module ready yet.

NEXT ACTION: Continue Computer Programming 1 with Variables and types, preserving per-module gates and adding the remaining learning rewards/challenge/shuffle features. Keep translations until the English course is complete. Do not count temporary samples as curriculum.


Pilot verification candidate: the locally generated first-module manifest is temporarily ready so the actual static lesson/exercise routes can be built and tested. This is not a completed-module gate result or a deployment. Independent editorial re-review resolved all reported defects and supplied hashes for 29 files. Native draft validation passed again (32 lesson + 116 exercise cases). Restore draft status if candidate rendering fails and cannot be fixed; do not count it as open until mounted checks pass.


## Completed pilot: Meet the language

- English source: scripts/author-first-module.mjs and scripts/learning-content/cp1/meet-the-language; regenerate deliberately with npm run seed -- --author-first-module --learn-only (returns edited content to draft for review). Ordinary seed restores authored sources without erasing status.
- Four lessons, nine exercises, twelve recall cards per code track; five checkpoint questions. All four tracks share cases; input includes empty, spaced, Unicode and leading-space names.
- Native/full readiness validation: 32 lesson cases +116 exercise/arrangement cases. Independent review by /root/review_learning_engine; all reported P2/P3 corrections re-reviewed; 29 file hashes match. docs/reviews/cp1-m1.md records scope and required learner-experience answers.
- Typecheck, lint and build passed; build exported 1,583 entries. Updated full unit suite: 592 passed. Export privacy/SEO verification passed for 16 lesson-track pages and nine exercise pages/images.
- Mounted actual pages: 32 complete lesson/track/theme flows and eight map/checkpoint flows passed; real JS/TS/Python runs, honest unavailable Java state. Actual prediction/Modify and Parsons drafts survive reloads and track switches; keyboard focus stays on moved blocks.
- Accessibility: 24 WCAG A/AA axe scans at 360/768/1280 in Paper/Night, no violations or overflow. 1280 routes also passed reflow at the effective 200%-zoom viewport (640x450). CSS zoom alone was discarded as a test method because it does not reproduce browser zoom's media-query viewport changes.
- Evidence: artifacts/learning-engine/{first-module,persistence,accessibility}.json. Production static pages used because the independently recorded dev-server mounting issue persists; no user dev processes were terminated.
- Candidate status is now confirmed by these gates; remaining 43 modules are planned, not complete. No deployment was performed.

- Pilot regression checkpoint: all 13 focused Playwright tests passed after the ready-content transition, including course names, planned-lesson fallback, real runtime probes, navigation polish and compact Pattern strength.
