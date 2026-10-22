Foundation lessons live inside the existing chapter unit sections. Each unit is a topic; JavaScript lessons use the existing Monaco editor and disposable worker runner. Lessons load from static JSON when opened. Problem statements continue to render on the server.

Author content in `scripts/curriculum/foundations.mjs`, called by `scripts/seed.mjs`, then run `npm run seed`. Receipt arithmetic and Stamp gates have six individually written steps. Later units reuse their existing worked algorithms with fading scaffolds and a receipt reference. Review those later units for teaching depth before presenting them as an individually authored beginner course.

The model in `src/lib/topic-foundations.ts` describes examples, starters, test cases, three hints, feedback, and a final recall check. Topic challenges remain the original problems, in their original easy-to-harder curriculum order. Their first proof strip mirrors the final lesson exercise. Original challenge IDs and solve history are retained.

Persistence is an additive v6 schema extension: `topicFoundations` defaults to `{}` when absent. No version bump or destructive migration is necessary. Old v1–v6 backups still use the existing migration chain. New backups include topic drafts, attempt counts, hint counts, and completion; imports validate the field before replacement. Legacy `foundations` and `learning` data remain separate. All writes use `src/lib/storage.ts` through the existing store adapter.

Free browse opens chapters; each topic's foundation still gates its challenges, including direct challenge URLs. Existing solved problems remain marked solved, but learners must complete the new lesson before running the topic's challenges again. Lessons never generate submissions, scores, streak penalties, or Watch events.

Validation: `npm run typecheck`, focused storage/migration tests, the foundation answer test in `src/tests/runners.test.ts`, production build, and `e2e/foundation.spec.ts`.
