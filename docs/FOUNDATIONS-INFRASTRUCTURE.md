# Foundations infrastructure

Updated 2026-10-16. Authorized scope: **Build infrastructure; keep lessons gated.**

No Foundations manifest, lessons, exercises or learning routes are published. Java remains Beta with no configured endpoint. The three live browser-worker probes remain required before curriculum authoring proceeds.

## Implemented

- Course/module/lesson/exercise types, separate public content and private answer packs, and Java 8 metadata in `src/lib/foundations/`.
- English, Tagalog (`fil`, URL prefix `tl`) and Bisaya (`ceb`) helpers. Explicit null translations fall back to English; translation status records draft/reviewed. Code and test data remain shared.
- Manifest validation checks membership, ordering, prerequisites, concept introductions, translation structure, capstones and accidental private-answer exposure.
- Separate Foundations progress and reward calculations. Existing Path counts and prerequisites remain independent.
- Settings saves the Foundations lesson-language preference while explaining that lessons are unavailable.
- Active storage edition 4 copies existing v3 Path data, retains original namespaces and accepts v1–v4 backups. Migration writes its marker last and rolls back partial copies on failure. A quota failure immediately offers export of the intact prior edition.

All application localStorage access remains centralized in `src/lib/storage.ts`. No backend, database or new dependency was introduced.

## Future content validation

`npm run validate:foundations` reads an approved manifest at `src/data/foundations.json` and module content under `src/data/foundations/`. Public content is checked separately from private answer/reference packs. Reference Java compiles with `javac --release 8`, then runs against visible and hidden cases. The existing function harness and whole-program stdin/stdout paths are covered separately.

At this stage the command intentionally exits with an explicit missing-manifest gate. This is not a successful validation of authored curriculum. Native Java unit fixtures verify validator infrastructure; they do not establish that the live browser Java runtime works.

## Verification

Typecheck, ESLint, 555 unit tests and the production static build passed. Two targeted browser tests passed: v3 migration → language preference → v4 export/restore, and quota failure → intact v3 backup download. Full browser results are recorded in `VERIFICATION.md` and `artifacts/foundations-infrastructure-playwright.json`.

Content approval, native translation review and live Java readiness remain outstanding. See `FOUNDATIONS-AUDIT.md` and `translation-review.md`.
