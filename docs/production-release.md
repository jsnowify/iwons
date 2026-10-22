# Production release verification

Verified on 2026-10-22 at **https://iwons.vercel.app**.

## Released application

- `c304c2c`: optional credential accounts, Foundation lessons, progress sync,
  private profile photos, recovery-code password reset, server judging, and UI
  improvements. The commit contains the detailed implementation and validation
  record.
- `20d4c4cf`: repair offline-asset generation after the Vercel Next.js adapter
  moves generated HTML. Refresh the packaged service worker as well as its
  source, preserving deployment query strings.
- The newer avatar compression module is tested infrastructure only. Its
  proposed multipart/public-avatar API and replacement upload UI remain pending;
  the existing private photo uploader is the released flow.

## Production configuration

The Git-connected `iwons` Vercel project deploys `main` to `iwons.vercel.app`.
MongoDB and runner credentials, the session secret, and canonical origin are
configured as production environment variables. Credentials are absent from
Git, public HTML, and browser bundles. OAuth is not configured; username/password
accounts and guest mode are the released options. Password reset uses a saved
private recovery code, not email delivery.

Initial API checks returned 503 after the build was ready: Atlas allowed only
the development machine. The dedicated `iwons` Atlas project now permits
`0.0.0.0/0` for Vercel's dynamic outbound addresses, matching
[MongoDB's documented Vercel setup](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/).
Database access still requires TLS and the application's database-scoped
credentials (`readWrite` on `iwons`, restricted to the `iwons` cluster). No paid
static-egress product or database upgrade was enabled. A future fixed-egress
setup can replace the broad network entry. No existing user records were edited
or deleted, and live smoke checks created no test accounts.

## Validation

- Full unit/integration suite: 882 tests passed before the adapter repair; six
  new postbuild regression tests passed afterward. GitHub Actions for
  `20d4c4cf` passed the complete updated checks (888 tests).
- Typecheck, lint, production build, contrast, curriculum integrity, readability,
  and SEO checks passed. The build generated 795 routes; SEO checked 770 HTML
  files and 716 sitemap URLs.
- The full browser suite passed 101/103 checks initially. Local photo-preview
  and About creator-region regressions were repaired; all seven affected checks
  passed after rebuilding. Four hydration/offline checks passed after the adapter
  repair. The complete browser suite was not rerun after these targeted fixes.
- Live production pages `/login/`, `/signup/`, `/reset-password/`, `/foundation/`,
  `/leaderboard/`, and `/about/` returned 200 and rendered their expected content,
  with no uncaught browser errors. Foundation lists all 60 lessons.
- The challenge editor remained at its 12 px sticky offset while scrolling the
  question on desktop. At 390 px, Foundation had no horizontal overflow and the
  mobile navigation opened successfully.
- Live username availability, leaderboard, and language APIs returned 200 after
  Atlas network configuration. A guest Java Run on `server-add-two-numbers`
  completed through the production API, Atlas, and configured free runner:
  **accepted, 2/2 visible cases**. This does not establish Java support for legacy
  browser-only challenges.
- The production service worker and all 20 precached URLs returned 200; private
  API requests remain excluded from service-worker caching.
- Auth index check reported no pending changes or duplicates; required server
  indexes were applied. Existing configured secrets were absent from scanned
  tracked/public files and generated public assets.

Use the login/signup routes above for account entry. Recovery requires a code
previously generated and saved from Profile. Successful sign-in, avatar upload,
and password recovery were covered with disposable local MongoDB and browser
tests; no existing production account was used for those checks.
