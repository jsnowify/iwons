Foundation is an optional, standalone learning track at `/foundation/`: 60 short lessons in five modules for beginners. All nine chapters and all challenges are always accessible, including direct challenge URLs with zero progress. Foundation completion never controls Run, Submit, navigation, challenge stats or leaderboards.

The former card and `TopicFoundation` wrapper sat in `src/app/path/[level]/page.tsx`, above each topic unit's challenge list. The wrapper and workspace gates are removed. The older per-topic foundation data (`public/foundation-data/`, stored under their own topic ids in `topicFoundations`) is left untouched for backup compatibility but has no active UI.

## Curriculum and status

`src/data/foundation/modules.json` lists the five modules and `src/data/foundation/curriculum.json` lists the 60 topics in order, each tagged `code` (30) or `concept` (30). Every topic now has written content and a `contentId`. A topic without one would show "Coming soon" on the overview as plain text, never as a lock.

| Module | Topics | Written |
| --- | --- | --- |
| 1 Core programming fundamentals | 1 to 14 | all 14 |
| 2 Data structures and algorithms | 15 to 27 | all 13 |
| 3 Programming principles and design | 28 to 38 | all 11 |
| 4 Computer science fundamentals | 39 to 48 | all 10 |
| 5 Practical software engineering foundations | 49 to 60 | all 12 |

## Lesson types

- **Code lesson:** a neutral explanation (at most 3 short sentences), a one-line syntax note per language, a complete worked example, a practice task in the existing Monaco editor, a Run button, three optional hints (the last has a reassuring line and the answer), reset to starter, and Previous/Next links that are never prerequisites. Languages are JavaScript and Python, with a switch that remembers the choice. Tasks state a goal rather than syntax, so one task fits both languages.
- **Concept lesson:** an explanation, an illustration with a plain-language caption, an optional read-only code snippet per language (each with the exact output it prints), and a 2 to 3 question multiple-choice check. A wrong answer gets "Not quite yet" and a nudge, the full explanation appears after two misses, and a right answer explains why it is right. No editor is shown.

Run uses the existing local workers (the JavaScript worker, and Pyodide for Python, which downloads on first use), not Judge0. Output is compared with the expected output. A task may check several inputs (`cases`, each with `stdin` and `expected`), which stops a program from printing a fixed answer, and the feedback names the input that failed. Expected output can differ by language where the languages print differently, such as `true` and `True`.

## Authoring

Write lessons in curriculum order: Module 1 in `scripts/curriculum/foundation-track.mjs`, and Modules 2 to 5 in `scripts/curriculum/foundation/module-N.mjs` (shared helpers in `helpers.mjs`), then run `npm run seed -- --foundation-only` (or `npm run seed`). It validates each lesson (explanation sentence count, three hints, concept checks, cases), writes the public reading material to `src/data/foundation-lessons.json`, writes starters, answers, hints and concept checks to `public/foundation-lessons/<id>.json`, which are lazy-loaded so answers are absent from the initial HTML, and removes practice files for lessons that no longer exist. Then set the topic's `contentId` in `curriculum.json`.

## Progress

Persistence uses the existing v6 `topicFoundations` map under the additive `foundation-track-v1` key, with lesson ids as step keys. JavaScript uses the lesson id as the step key and Python uses `<id>-python`, so each language keeps its own draft and hint level, and finishing in either language completes the lesson. Concept lessons store which questions are answered in the step's `code` field. New records are created lazily on visiting a practice, and reset restores the starter while keeping completion. This does not change the storage or account wire schema, so no migration or version bump is needed. Account holders use the existing per-step timestamp merge and completion union; guest work stays local. All storage goes through `src/lib/storage.ts`, including the remembered language.

The first six lessons shipped under shorter ids (`print-a-message`, `variables`, `simple-sum`, `conditionals`, `loops`, `functions`) before the 60-topic curriculum. Their completion still counts for the new ids (`legacyLessonIds` in `src/lib/foundation-track.ts`), so no one loses progress, but drafts are not carried over because the tasks changed.

## Discovery

The sidebar and the mobile menu have a Foundation entry. `/path/` and `/problems/` show one small dismissible line, remembered through the storage module. Challenge details show plain "Related lessons (optional)" links to at most four lessons, matched on whole-word starts of each lesson's `topics` tags, so generic lessons carry no tags. There is no card on any challenge page.

## Verification

Unit tests run every example, every answer against every case, and every starter (which must not pass) for all 30 code lessons, and run every concept-lesson snippet and compare it with the output shown: in the real JavaScript worker, and in a local CPython for Python when it is installed. They also check the outline (60 topics, 30 code, 30 concept), the sentence limit, concept checks, progress merging and carried-over completion, feedback wording, related-lesson relevance and that no challenge depends on Foundation state. Browser tests cover drafts, hints, language switching, concept checks, zero-progress challenge access, the discovery line, retry, mobile layout in both themes, and account sync across two device caches.
