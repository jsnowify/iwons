# Judge and account data fixes

## Scope and assumptions

This pass preserves the completed UI and local guest behavior. New data uses
existing components and tokens. Verdicts keep the existing snake_case format;
`internal_error` is displayed as Internal Error. Published case array order is
stable; anonymous hidden ordinals follow it. Cancel is logical cancellation,
not a promise that upstream execution has stopped.

## Fixes 1?6

- `src/lib/judge0/{contracts,results,service}.ts`, shared types/presentation and
  the judge UI: typed platform failures, private diagnostic logging, no attempt
  or solve recording, and idempotent user/IP attempt refunds.
- `results.ts`, `judge-ui.tsx`: hidden statuses contain only ordinal and enum;
  Run has no hidden rows. Submit retains both individual locked rows and totals.
- `judge-repository.ts`, `/api/judge/[jobId]/cancel`, polling and workspace:
  owner-checked atomic cancel/finalize, canceled GET state, already-finished
  results, cancellation during creation and graceful request failure.
- `/api/handle/available`, account handles helper and hook: shared validation,
  owner-aware unique-index lookup, 20/minute user/IP limits, uncached hints,
  400 ms debounce and stale-response cancellation. Saves remain authoritative.
- `accounts/importable.ts`, compact catalog IDs, account provider and repository:
  shared filtering for preview/import, separate skipped-item count and intact
  guest copy. Custom problem definitions remain local, so their drafts/solves
  are excluded from account imports.
- Shared sidebar navigation: Leaderboards entry also appears in mobile More.
  Existing active-state and keyboard behavior apply; no navigation badge.

No index/backfill is needed for canceledAt: MongoDB null filters also match
legacy missing fields, and job writes use the existing unique _id index. Refund
ledgers live in the existing expiring rate buckets.

## Existing tests changed intentionally

- `src/tests/judge0.test.ts`: status 13 and empty-stderr NZEC now expect
  internal_error. Added typed-source/logging/refund, hidden privacy/order and
  cancel/ownership/race checks.
- `src/tests/accounts.test.ts`: added handle validation/ownership/limiting/save
  race and catalog/custom preview parity checks. Existing assertions retained.
- `e2e/server-judge.spec.ts`: the successful Submit fixture now supplies the
  typed source and anonymous hidden rows; asserts each hidden row. Added platform
  retry/no-history and durable cancel flows. Existing button wording retained.
- `e2e/accounts.spec.ts`: added availability/fallback/save-race and custom-item
  preview flows. Existing tests retained.
- `e2e/leaderboard.spec.ts`: added desktop/mobile navigation and active-state
  coverage. No existing navigation count/order assertions needed changes.

## Follow-ups

Public profile pages remain out of scope. The original 500 function-style
challenges still need server wrappers before they can earn verified credit;
this pass does not migrate or claim privacy for their legacy downloadable test
packs. No redesign or production deployment is included.


## Fix 7: opt-in verification queue

Added `/api/me/verification` and a server-only candidate reader. It returns only
the authenticated owner's unverified imported solves, supported publication
state and saved code; hidden grading data is never selected for the response.
The Progress summary hosts the optional action using existing UI styles.
`verification-queue.ts` owns a bounded client worker pool and a persisted
five-start rolling budget, respecting Retry-After. Queue metadata is scoped by
account in storage.ts and excluded from backups. Pause/Stop requests normal job
cancellation; resume never repeats locally completed entries. New lists omit
canonical verified solves, so another device can safely resume remaining work.
The existing server solve projection remains the authority for all credit.

Additional tests cover queue concurrency/budgets/retry/pause, concurrent imported
upgrades, owned/published/code-available candidates, metadata backup isolation,
Stop during pending job creation, and browser pause/reload/resume and rate-limited
unsuccessful replay. Candidate order is explicit by problem ID using the existing
userId/problemId index; tests do not depend on bulk-write insertion order.


## Final verification (2026-10-22)

- Fixes 1?6 were verified first: 791 unit/integration tests and all 92 browser
  checks passed before Fix 7 implementation started.
- Final complete suites: **797 unit/integration tests in 25 files** and **94
  Playwright checks**, all passing. Typecheck, lint, production build, curriculum
  integrity/readability checks and SEO checks passed (708 HTML files, 655 URLs).
- Current live guest API -> Atlas -> free Judge0 checks passed: Python Run
  accepted 2/2; Submit accepted 5/5 with exactly index/status keys for each hidden
  row; a new Submit canceled successfully and a late poll returned canceled.
  No live service is contacted by CI tests.
- A scan of source, public files and browser bundles found none of the actual
  configured service credential values.
- Live OAuth credentials are still absent. Signed-in flows, availability races
  and verification upgrades are covered by browser mocks and actual ephemeral
  MongoDB tests; no live account/OAuth verification or deployment is claimed.

The individual existing test cases extended were:

1. Judge unit ?runs only visible cases and submits all cases??: asserts anonymous
   hidden statuses and unchanged Run visibility.
2. Judge unit ?masks hidden runtime output and maps status/error variants?:
   status 13 and empty-stderr NZEC now expect internal_error.
3. Account unit ?preserves guest drafts and lessons??: also proves verification
   metadata is excluded from backup exports.
4. Browser ?guest stdin exercise polls, saves drafts and history??: supplies the
   new result fields and checks the locked hidden rows.

All other additions are new test cases; no existing navigation count/order
expectations needed changing. Existing UI wording and layout assertions remain.
