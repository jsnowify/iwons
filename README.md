# Iwons

**Type it. Test it. Own it.** A coding practice app with local guest learning and an optional server judge.

## Run locally

Requires Node.js 22.18+ and npm. This workspace was verified with Node.js 24.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Explore the Path or open **Your desk** and choose **Make it yours** to set your name, language, and Watch consent before running code.

For the production server build:

```sh
npm run build
npm start
```

The production preview runs at http://127.0.0.1:3000. Development and production use Turbopack. The build output is `.next/`; `npm start` uses `next start` so API routes can run. Do not serve an older `out/` directory.

After editing worker sources during development, run `node scripts/build-workers.mjs` or restart `npm run dev` to rebuild the independent static worker.

The wordmark uses a static block cursor. Skeleton pulse and the editor caret retain their separate loading and editing behavior.

## What is included

- Next.js App Router, strict TypeScript, Tailwind, and Paper and Night themes, typewriter typography, and self-hosted fonts.
- A new landing page, personal dashboard, nine-level Path map, and primers for all nine chapters.
- **500 original challenges** in 54 units across Levels 0 to 8, with four-language starters, three visible and six hidden cases each.
- All chapters and challenges are always open. Optional [Foundation lessons](docs/foundation-lessons.md) teach the basics on their own track. Readable text, motion controls, and an optional carriage bell remain available.
- A v3 migration that archives previous submissions, progress, notes, lists and drafts. Retired problem URLs explain the change.
- Search, difficulty/topic/status filters, sorting, bookmarks, and custom lists.
- Automatically opened Monaco workspace, per-language drafts, progressive hints, notes, gated editorials, custom cases, stdout, verdicts, and case comparisons.
- JavaScript/TypeScript execution in disposable workers; lazy Python through Pyodide; server-side Judge0 integration for Java.
- Submission history, reopen-in-editor, local progress, activity calendar, streaks, XP, milestones, clean solves, and a downloadable Flex Card PNG.
- Path-based Daily Warm-up 3, an immediately visible nine-algorithm Visualizer with optional step audio, spaced repetition, 30-day and 14-day study plans, fullscreen contests and mock interviews with a shared timer.
- Custom-problem authoring, JSON problem import, and reference-solution checks.
- Consent-based Iwons Watch, focus/visibility/paste/fullscreen/typing-burst/second-tab signals, scoring, and self-reported welcome-back notes.
- Versioned local storage, quota recovery, backups, import validation, and confirmed reset.
- Static SEO pages, topic pages, per-problem social images, JSON-LD, sitemap, robots, web manifest, and service-worker caching.
- Keyboard shortcuts, responsive layouts, reduced motion, accessible dialogs, loading states, and a `/design/` component gallery.

## Verification

Build/load measurements, archive restoration and current checks are in [PERF.md](docs/PERF.md). `npm run lint` runs ESLint directly because Next 16 removed `next lint`.

The current [redesign audit](docs/REDESIGN.md), [verification results](docs/VERIFICATION.md), and [54 curriculum reports with sample statements](docs/curriculum-reports/README.md) document the 500-problem release.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The unit/integration suite checks all 4,500 cases against the JavaScript and TypeScript worker and independent Python reference solutions. Python 3 is required for the native Python reference test. Java harness tests run when a JDK is available. The app itself requires neither Python nor Java installed locally.

Playwright covers onboarding, accepted/wrong/invalid/non-terminating solutions, actual browser Pyodide execution, persistence, custom authoring, lists, responsive themes, SEO HTML, and offline reload. Install its browser if needed with `npx playwright install chromium`.

`npm run validate:problems` executes every reference in the actual JS/TS worker, the exact Python harness, strict TypeScript checking, and native Java. A JDK and Python 3 are required for curriculum validation. Per-unit reports and three sample statements are saved in `docs/curriculum-reports/`.

`npm run seed` regenerates the problem JSON, lazy test/editorial packs, development references, and compact search and level-unlock indexes from `scripts/seed.mjs`. Hidden cases and editorials are not in the initial page HTML. These legacy local test packs can still be downloaded or inspected. The new server judge exercise keeps its hidden cases in MongoDB and returns anonymized hidden statuses and aggregate statistics.

## Server-side Judge0 integration

Published server problems execute through Iwons' server-side Judge0 integration, which supports Java, Python, and JavaScript without exposing provider credentials. Java execution for the original 500 browser-only challenges is unavailable until their Solution wrappers are implemented; selecting Java does not enable those wrappers.

The test harness has been compiled and tested with a local JDK for all 500 problems and 4,500 cases. Upstream Judge0 services are configured server-side in the deployment environment.

Official references: [Judge0 CE](https://ce.judge0.com/), [Pyodide worker documentation](https://pyodide.org/en/stable/usage/webworker.html).

## Data and runtime limits

- Guest curriculum progress stays in this browser; export a backup before clearing storage. The optional server judge stores submitted code and grading jobs in MongoDB for up to an hour plus TTL cleanup delay. Optional accounts sync core progress and server-judged history; leaderboards require an explicit opt-in and verified server solves. Sign up at `/signup/` or sign in at `/login/` with a username and password; OAuth is not required.
- Storage access is centralized in `src/lib/storage.ts`, under `iwons:v6:*`. Original v1?v5 namespaces and archived progress remain intact, and v1?v6 backup imports are supported. Up to 20 submissions are retained per problem, preserving an accepted solve. Cleanup keeps recent submissions and accepted solves.
- Watch is an honor system. It cannot see another website, app, browser, phone, camera, or screen. It never records individual keystrokes. Browser-size devtools heuristics are intentionally omitted because they are unreliable.
- Worker timeouts keep the UI responsive. Workers are not a security boundary for running hostile code: use code you trust.
- Monaco is served locally. Python downloads pinned Pyodide 314.0.7 from jsDelivr on demand; the first Python run requires internet. Offline features depend on resources having been cached successfully. Java executes via the server-side judge.
- Local-only submission detail and custom problem URLs use `/submissions/detail/?id=…` and `/problems/custom/?id=…`. These static shells avoid requiring a backend for dynamic local IDs.
- Flex Cards are local self-reported stats, not verified certificates. Activity reflects retained submission history.

## Deploy

Deploy the Next.js project on Vercel using `npm run build`. API routes run as serverless functions; public pages remain prerendered where possible. Keep `sw.js` uncached or revalidated. API responses bypass service-worker storage. Configure server secrets only in the deployment environment; see [server judge setup](docs/server-judge.md).

Set `NEXT_PUBLIC_SITE_URL` to your final canonical origin when publishing to a custom domain. The default is `https://iwons.vercel.app`; preview deployment URLs are never used automatically. Local guest lessons and workers need no service credentials; server judging requires the private environment configuration in `.env.example`.

`npm run og` checks content hashes and generates only changed social PNGs. Builds skip the generator when all source inputs and cached files are unchanged. Hashed images are immutable; the stable PNG aliases preserve old social links.

Search Console submission and third-party structured-data validation require the final published domain. Lighthouse and browser test results are local checks, not a guarantee across every browser, device, or hosting environment.

## Optional accounts and server judging

Signed-in users can also create **private rooms** at `/rooms/`: pick catalog or custom problems, invite people with a link, and follow a room leaderboard that is separate from the global one. See [docs/rooms.md](docs/rooms.md).

The optional server judge implementation and setup are documented in
[docs/server-judge.md](docs/server-judge.md). Use `.env.example`, `npm run
db:migrate`, `npm run seed:judge`, and `npm run judge0:smoke` to verify the live
judge. The app now needs a Next
server deployment (`npm run build`, `npm start`), rather than serving `out/`.
The live guest check passed in Java, Python and JavaScript using the free
OnlineCompiler.io endpoint. Username/password accounts are available at `/signup/`
and `/login/`; no OAuth subscription or provider app is needed. Signup collects
a required, unique, valid-format email without ownership verification. Guest
learning stays available. See [credential account setup](docs/credential-accounts.md)
for MongoDB indexes, environment variables, session security, tests and the full
browser checklist. Optional photos and free recovery-code password reset are
available from Profile; see [photos and recovery](docs/avatars-and-recovery.md).
Account deletion, general settings, leaderboard opt-in and guest import remain deferred.

Verify: sign up, refresh while signed in, open Profile, sign out on the same
page, retry login with a wrong then correct password, and try duplicate usernames
and emails. Confirm a fresh guest can still edit and run challenges.

## Judge results, cancellation and account hints

The server verdict union includes `internal_error` with `failureSource: "platform"`.
Judge0 status 13/14, JVM/sandbox startup failures and empty-stderr NZEC receive
this verdict; ordinary compile/runtime mistakes have `failureSource: "user"`.
The UI uses the typed source rather than matching message text. Full platform
failure details stay in server logs. Platform failures create neither attempts
nor solves; their user/IP attempt charge is refunded once per job. Provider
quota and the provider-wide limiter cannot be refunded.

Submit responses include `hiddenCases: [{ index, status }]`, where status is
`passed`, `failed`, `timeout` or `error`. Ordinals follow the published problem's
stable case order. No hidden names, inputs, expected/actual output, diagnostics
or per-case timing/memory are returned. This reveals a small amount of per-case
correctness information: Submit remains limited to five requests per minute per
user and IP hash. Run continues to expose only visible examples.

`POST /api/judge/[jobId]/cancel` verifies ownership and races finalization via a
single-document conditional update. If cancellation wins, GET returns
`{ state: "canceled" }` and the job can never record a submission or solve. If
finalization won, cancellation returns the stored result with
`alreadyFinished: true`; it cannot undo that result. Judge0 execution may keep
running, and cancellation retains its attempt charge and provider quota. Stop
requests cancellation even if job creation is still returning its ID. A network
failure before that ID is received can prevent confirmation. Existing jobs with
no `canceledAt` field behave like `canceledAt: null`; no backfill/index is needed.

`GET /api/handle/available?handle=...` is an uncached hint limited to 20 checks
per minute per IP hash and authenticated user. It uses the save path's format
and reserved-word validation. Own handles remain available; the unique users
index still decides save races. The form debounces checks by 400 ms, cancels
stale requests, and falls back to save-time validation on network/rate errors.

Import previews and server imports use `filterImportablePayload` with the same
compact catalog IDs. Custom solves and drafts stay on the device and appear as
skipped items. Leaderboards is available in both the sidebar and mobile More
menu, without a rank or badge in navigation.

### Verify imported solves (optional)

Signed-in learners with imported solves can open Progress and choose **Verify my
imported solves** in their personal summary. Only published server-judge problems
with imported draft code can run. Missing code gets a solve-again explanation;
legacy function-style problems remain local until server wrappers exist.

This client queue uses the normal Submit API and its normal idempotent solve
projections. It runs at most three jobs concurrently, bounded by a 100-case CE
queue budget or the free provider's smaller eight-case budget. The current
five-case exercise therefore runs one at a time on the free provider. Starts
are limited to five per rolling minute; server Retry-After pauses scheduling.
The API still enforces its own user/IP and provider-wide limits.

Pause or Stop cancels in-flight jobs and preserves pending work for Resume.
A result that already finalized can still be kept, under the normal cancel race
rule. Queue state and recent start times use account-scoped versioned metadata
in the storage module, outside v1?v6 backups. Reload resumes pending work only
after another explicit click; signing out never transfers it to guest storage.
Verified database solves are omitted from new candidate lists. Unsuccessful
replays stay as personal imported solves, without leaderboard credit; platform
or network failures pause the queue instead of blaming the code. No background
process or scheduled server task is added.
