# Optional server services: implementation status

For the next setup step, see [Judge0 setup](judge0-setup.md).

The live Phase 1A gate passed: Java, Python and JavaScript returned Accepted
for Hello World, then guest Run (two cases) and Submit (five cases) through Iwons.
MongoDB is provisioned and the free OnlineCompiler.io endpoint is configured.

Phases 2 and 3 added the account progress and leaderboard infrastructure.
The current account pass replaces OAuth login with optional username/password
signup; see [credential accounts](credential-accounts.md) for current setup and
browser checks. Import, deletion/settings and leaderboard opt-in are deferred
for new credential accounts; legacy data and infrastructure are preserved. The original 500 function-style challenges retain their
legacy local execution path and cannot earn verified leaderboard credit.
Phase 1B Solution wrappers, migration of legacy public hidden packs and monthly
boards remain deferred. Opt-in imported-solve replay is now implemented for
published server problems with saved code; see [the fixes report](judge-fixes.md). The reserved wrapper flag
does not enable an unfinished runtime.

## Verification evidence (2026-10-22)

- Live MongoDB initialization and the free hosted smoke test passed. Guest Run
  and Submit passed in all three supported languages through the browser, API,
  database job and provider. Screenshot: `artifacts/free-judge-live-guest.png`.
- `npm test`: 797 tests across 25 files passed, including concurrent solve
  recording, account-job ownership, interrupted effects recovery, import merge
  and leaderboard ordering/privacy. Tests use an ephemeral MongoDB and mocked
  execution provider; CI does not spend the live quota.
- Fixes 1?6 passed the complete 92-check browser suite before imported replay
  was built. The final suite passed all 94 browser checks, including replay pause/reload/
  resume and rate-limit handling; see the fixes report for the changed-test list.
- Production build, typecheck, lint and SEO checks passed (708 HTML documents,
  655 sitemap URLs). A scan of browser bundles, public files and source found
  none of the configured service secret values.
- These earlier account browser checks used mocked sessions. The credential
  pass adds real signup/login/logout checks against disposable MongoDB; see
  [its verification notes](credential-accounts.md). Production deployment and
  authenticated live judging are separate checks, not claimed here.

## Inspection and assumptions

- Next.js 16.4.1 App Router, strict TypeScript, Zustand, Monaco, no existing auth.
- Existing active storage uses `iwons:v6:`. `progress` maps problem IDs to boolean;
  `submissions` holds code, language, verdict, timing, results and local Watch
  metadata; `settings` holds editor and appearance preferences.
- `topicFoundations` maps topic IDs to `{ steps, completed }`; each step contains
  code, completion, hints and attempts. Older `learning`, `foundations`, and
  archive records remain separate. Draft keys are
  `iwons:v6:drafts:<problemId>:<language>`. No local schema migration is needed in
  Phase 1A: the new exercise reuses existing draft and submission shapes.
- Static problem authoring lives in `scripts/seed.mjs`, unit definitions and
  `src/data/problems/`. Statements are server-rendered. Existing local challenges
  currently fetch public lazy hidden-test packs; these are not secure against
  inspection and are **not** server-verified leaderboard solves.
- `src/components/code-editor.tsx` wraps Monaco. Existing local JavaScript,
  TypeScript, Python and lesson workers remain intact. The legacy Java worker
  still uses an explicitly configured endpoint. The new server exercise does
  not use it, and never exposes Judge0 credentials or calls Judge0 directly.
- Preserve the original UI and guest learning flows. Introduce one isolated
  stdin exercise before attempting to adapt the 500 function-style problems.
  Migrating those problems and removing their public hidden packs belongs to the
  later verified server migration, not an untested wrapper conversion.
- The judge API supports guests and accounts. Only published server-judged
  accepted submissions award leaderboard credit; local and imported results do not.

## Files and architecture

- `src/lib/db/client.ts`: globally reused MongoClient promise, pool size five,
  bounded connection waits, lazy initialization and safe retry after failure.
- `src/lib/db/judge-repository.ts`: validated published problem reads, jobs,
  immutable expected-output snapshots, compare-and-set finalization, durable
  minute-bucket limits and one-hour discovery caches.
- `src/lib/judge0/`: strict shared contracts, server-only transport/languages/
  limits/grading/HTTP boundaries and dependency-injected job service.
- `src/app/api/judge/route.ts`, `src/app/api/judge/[jobId]/route.ts`:
  create and check jobs. POST requires the same Origin. Requests are capped while
  streaming, not merely by trusting Content-Length. Responses are no-store.
- `src/app/api/languages/route.ts`: language keys and display names only.
- `src/lib/judge-polling.ts`: same-origin polling with gentle backoff, abort on
  navigation and a 60-second overall deadline. No frontend Judge0 URL or token.
- The guest practice page for the demo problem (`/problems/server-add-two-numbers/`)
  was removed because it confused learners. The judge API, polling and the demo
  problem data stay for verified solves and imported replay.
- `scripts/curriculum/judge-problem.mjs`: original example with two visible and
  three private cases. `npm run seed` emits the public-only demo projection.
  `seed:judge` writes the full problem to the operator's database.
- `scripts/db-migrate.ts`, `scripts/seed-judge.ts`,
  `scripts/judge0-smoke-test.ts`: explicit operator-run setup and live checks.
- `src/tests/judge0.test.ts`, `e2e/server-judge.spec.ts`: Mongo concurrency,
  upstream mocks, API privacy, client progress and guest persistence tests.

## Deployment and environment

Next static export cannot host POST APIs. `npm run build` now builds a normal
Next server deployment; `npm start` runs that build. Vercel deploys the route
handlers as serverless functions. No app-owned worker process or scheduler is
required: Judge0 owns execution, and each GET makes a bounded upstream check.
Do not deploy or serve an older `out/` directory. `start:static` is retained only
for inspecting historical exports. The postbuild check verifies the new routes,
public HTML and service-worker API exclusion and refreshes offline shell assets.

Copy `.env.example` to `.env.local` and configure these **server-only** entries:

The workspace's dedicated Atlas `iwons` project/cluster has been provisioned on
the free AWS Singapore tier, with the `iwons` database and a database-scoped
`iwons_app` user. Local `.env.local` contains the generated connection and HMAC
secret and is ignored by Git. Only this machine's public IPv4 address is allowed;
deployment access still needs its own network configuration. This machine's DNS
resolver rejects SRV queries, so its local connection uses Atlas's equivalent
standard TLS replica-set URI. Other environments may use the SRV URI normally.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas driver connection string |
| `MONGODB_DB` | Dedicated database name, e.g. `iwons` |
| `AUTH_SECRET` | At least 32 random bytes, base64/hex encoded, for JWT sessions and IP HMACs |
| `JUDGE0_URL` | Trusted Judge0 CE-compatible base URL, HTTPS in production |
| `JUDGE0_AUTH_HEADER` | Token header, defaults to `X-Auth-Token` |
| `JUDGE0_AUTH_TOKEN` | Judge token if required by the instance |
| `JUDGE0_RAPIDAPI_KEY` | Optional RapidAPI key |
| `JUDGE0_RAPIDAPI_HOST` | Optional RapidAPI host |
| `TRUSTED_IP_HEADER` | Non-Vercel reverse-proxy header that is overwritten by your proxy |

On Vercel, requester hashing uses its platform-controlled forwarded IP header.
Other production hosts must supply a trusted proxy header; otherwise the API
fails closed. Plain forwarded headers are ignored in local development unless
explicitly configured. Raw IPs are never stored. Jobs expire after an hour, are
unpredictable 256-bit IDs. Account jobs require the same authenticated user; guest
jobs additionally require the original IP hash. A guest
whose IP changes must resubmit. TTL deletion is asynchronous; expiry is checked
on every job read. Submitted source code remains in the job until TTL cleanup;
it is not sent to analytics or included in error logs.

Create a dedicated Atlas database user with read/write access to this database.
Configure Atlas network access for your deployment's outbound IPs, or its Vercel
integration. Avoid broad network access where fixed egress is available. M0
connection limits apply to the whole cluster: a five-connection pool is per
warm function instance and drivers also open monitoring sockets. Keep Functions
and Atlas geographically close; watch total connections as concurrency grows.

Run from the repository root:

```sh
npm run db:migrate
npm run seed:judge
npm run judge0:smoke
npm run build
npm start
```

The smoke script submits Hello World in Java, Python and JavaScript, printing
language, status, decoded stdout and compile output. It deliberately exits
nonzero when unconfigured or unsuccessful. It runs only when requested; CI
never contacts a live Judge0 service. Scripts load `.env.local` using Next's
environment loader and use the server React condition for server-only imports.

## Limits and privacy

Language IDs are discovered by name, with explicit CE compatibility defaults
and warnings if discovery fails. Languages and instance maxima are cached for
one hour both in the warm module and MongoDB. Execution limits are clamped to
instance maxima; network execution is disabled. Java gets JVM memory/thread
headroom. Each upstream batch is at most twenty cases, or less if the instance
allows a smaller batch. Run uses visible cases; Submit uses all cases.

Outputs are compared after normalizing CRLF and trimming trailing whitespace
per line and trailing newlines. Hidden stdout, stderr, inputs, expected outputs
and case IDs are omitted from API responses. Submit exposes only stable hidden
ordinals and passed/failed/timeout/error status, plus aggregate statistics.
Visible diagnostics and compile errors are truncated to 10,000 characters.
Browser status/results never include provider tokens, URLs or configuration.
Rate limits are database-backed: five submits and ten runs per user and IP per
minute, and 180 status reads per IP. The free profile also enforces an account-wide
30-test/minute budget and eight-case cap. No correctness depends on a warm cache.
Finalization uses atomic compare-and-set. Account effects claim an expiring,
owner-bound job lease; stable submission IDs, unique solve IDs and per-statistic
problem ledgers make replay idempotent. Polls repair interrupted winners without
duplicating points. Account locks coordinate import, judged writes, profile
changes and deletion without transactions or persistent workers. Statistics use
atomic pipelines, never an unbounded aggregation of submissions.

Changing to self-hosted requires URL/token settings and JUDGE0_PROVIDER=ce;
discovery caches are namespaced by base URL. Adding a stdin
language needs one config entry plus its request-contract key and problem
starter. Function/Solution wrappers remain disabled; Java stdin programs must
have `public class Main`. The free hosted compatibility profile is described in [Judge0 setup](judge0-setup.md). Accounts now use username/password JWT sessions. Email format is validated,
but ownership is not verified. No provider credentials are needed.

## Accounts, sync and leaderboards

Use `/signup/` and `/login/`. Required environment and index migration steps
are in [credential account setup](credential-accounts.md). Credential accounts
have a minimal read-only profile and sign-out menu; legacy import, settings,
export/deletion and leaderboard opt-in UI are not offered in this pass.

Guest keys remain `iwons:v6:*`; account caches use
`iwons:account:v1:<scope>:*`. Logout restores the guest namespace. Timestamp and
queue metadata use a separate versioned namespace in the storage module. Existing
v1-v6 backups retain their shapes. No guest data is automatically imported.
Legacy merge infrastructure and tests are preserved for a later import pass.

Signed-in core progress uses GET/PUT /api/me/progress/ with debounced writes.
Account caches retain queued changes through network failure and reload. Identity
headers prevent another tab's login from sending queued data to a different user.
Recent server-judged history comes from /api/me/submissions/; existing cached
history is preserved when loading those rows. Notes, custom problems,
local timers and Watch journals stay local. Server submissions do not invent
Watch telemetry or qualify for Watch-based clean badges.

Legacy deletion infrastructure remains in the repository; deletion is unavailable
for credential accounts in this pass. JWTs lose API access if the user row no
longer exists. Guest data remains separate from account caches.

/leaderboard/ ranks solved descending, points descending, achievement time
ascending, then handle for stable ties. Cursor paging and own-rank counts use
indexes. Public rows contain no email, user ID or problem ledger. Guest responses
are CDN-cacheable for 60 seconds with stale revalidation; authenticated responses
containing own rank are private/no-store. POINT_WEIGHTS configures easy/medium/hard
weights, defaulting to 1/3/5. Each language counts distinct verified problems.

The original public hidden packs are legacy downloadable content and cannot
award verified credit. Making them private requires the separately deferred
function-wrapper/execution migration; they are not treated as secure test data.

Current manual checklist:

1. Confirm guest lessons, local Run, drafts and backup import still work.
2. Open server practice from Problems; Run and Submit without an account.
3. Follow the [credential signup/login checklist](credential-accounts.md#verification).
4. On a second device, check account progress synchronization and queued offline edits.

Legacy import/deletion and leaderboard opt-in checks remain covered by existing
mocked browser suites; these controls are deferred for credential accounts.

Primary references: [Judge0 CE API](https://ce.judge0.com/),
[MongoDB pools](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/),
[free host](https://onlinecompiler.io/pricing).
