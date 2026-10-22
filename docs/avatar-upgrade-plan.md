# Avatar upgrade plan — review before implementation

Status: Step 2 implemented and verified; awaiting confirmation before Step 3.
See [compression results](avatar-compression-results.md) for measurements and checks.
Routes, storage, dependencies, and the upload UI have not been changed in Step 2.

## Verified starting point

- Installed Sharp is **0.35.5**, using libvips 8.18.7 and libwebp 1.6.0. Reuse it.
- The current uploader accepts JPEG/PNG/WebP up to 2 MiB, sends a raw PUT,
  produces one 256 px WebP, and stores it in `user_avatars`.
- Its GET route is private and requires a session. Header/sidebar/profile already
  share `AccountAvatar`; leaderboard rows currently show initials.
- `users.avatarVersion` already exists as optional revision metadata. Image bytes
  are stored separately. Existing pictures need a non-destructive transition.
- The existing Mongo limiter uses minute buckets. An avatar-specific hourly
  window must be added without changing Judge0's rate-limit behavior.
- The existing account-deletion collection list does not include avatar storage.
- Next.js 16.4.1's installed route-handler documentation was reviewed.

## Ordered implementation

### Step 2 — compression module and unit tests, no HTTP

Create `src/lib/avatar/compressAvatar.ts`, shared policy constants, and
`src/tests/avatar-compression.test.ts`.

Validate signatures and the 36-million-pixel limit, decode only the first frame,
auto-orient, center-crop to a 256 px PNG base, and strip source metadata. Produce
128 px / 20,000-byte and 256 px / 40,000-byte WebP variants with quality and
dimension fallback. Check the final effort-6 output against its budget, even
when a cheaper probe passed. Return internal compression measurements separately
from the image buffers so the HTTP layer can log safe summaries later.

Tests cover formats, fake/truncated files, pixel limits, square dimensions,
metadata removal, fast path, bounded search, downscaling, and an injected deadline.
Use deterministic generated fixtures and a testable encoder boundary for rare
search branches, plus real-Sharp output tests. Pause for review after test results.

### Step 3 — routes, storage, migration, and API tests

Create `src/lib/avatar/repository.ts`, `multipart.ts`, and public/default-image
handlers. Update `src/lib/accounts/avatar-http.ts` and
`src/app/api/me/avatar/route.ts`; add:

- `src/app/api/avatar/[username]/route.ts`
- `src/app/api/avatar/default/[username]/route.ts`
- `scripts/avatar-indexes.ts`
- `src/tests/avatar-http.test.ts`

Use POST multipart field `avatar`, a bounded streaming parser, existing JWT/user
validation, Origin validation, account-scope checks, and Mongo-backed 10/hour/user
limits. Add a streaming parser dependency if the repository has no suitable one;
do not use an unbounded `request.formData()` read.

Keep bytes exclusively in `avatars`, with a unique `userId` index and one atomic
upsert incrementing its version. Reuse the existing account lifecycle protections
so deletion cannot leave an orphaned upload. Add both legacy and new avatar
collections to the existing account-deletion cleanup in `src/lib/db/accounts.ts`.

The migration command will have check/apply modes, preserve legacy pictures until
conversion succeeds, be safe to rerun, and keep old image URLs compatible during
the transition. No live migration is performed as part of this plan.

Public GET serves only image bytes and safe headers. Versioned responses get
ETags/304 and immutable caching; missing pictures redirect to an escaped,
generated initials SVG with no database image record. DELETE removes stored
variants and refreshes the revision metadata used by clients.

Add an avatar-specific hourly limiter helper and tests rather than modifying
the existing Judge0 minute-window semantics. Enforce the 8-second processing
deadline before persistence, and emit only the requested IDs and size/quality/
probe/duration measurements in server logs.

### Step 4 — client pre-compression and upload UI

Create `src/lib/avatar/compressClient.ts`. Update
`src/components/avatar-editor.tsx` and scoped existing avatar CSS in
`src/styles/auth-pages.css`.

Reuse `Modal`, `Button`, and the toast provider. Validate a file before decoding,
use ImageBitmap with an image-element fallback, center-crop to 512 px, and encode
WebP at 0.8 / retry 0.65. Show a circle preview with the requested alt text,
compressed upload size, Looks good / Choose another, Save, and Cancel.

Provide all five status states, aria-live announcements, visible input labels,
44 px controls, abort/cancel behavior, and cleanup of URLs, bitmap, and canvas.
Keep the current picture until the new upload succeeds. The preview size is the
pre-compressed upload size; the later verification report gives stored sizes.

### Step 5 — header, sidebar, profile, and leaderboard

Update `account-avatar.tsx`, its callers in `account-menu.tsx`, `sidebar.tsx`,
`account-profile.tsx` / `avatar-editor.tsx`, and `leaderboard.tsx`.

Update avatar URL helpers/account response validation as needed in
`src/lib/accounts/avatar-policy.ts`, `contracts.ts`, `current-credential.ts`,
`src/lib/db/accounts.ts`, and `credential-users.ts`. Extend leaderboard response
metadata in `leaderboard-contract.ts` and `src/lib/db/leaderboard.ts`.

Use 128 px for compact avatars and 256 px for Profile. Preserve scores, ranking,
pagination, opt-in behavior, and existing response fields; add only public avatar
metadata. Store that metadata with existing stats so leaderboard reads never
join or fetch avatar bytes. Do not change authentication or judging behavior.

### Step 6 — verification and image report

Update `src/tests/avatars.test.ts`, relevant account/leaderboard tests,
`e2e/account-profile.spec.ts`, and leaderboard browser tests. Run typecheck,
relevant tests, lint, then build before browser checks.

Verify mobile/desktop, both themes, keyboard use, cancellation, persisted reload,
remove/default behavior, duplicate parallel upload safety, auth/Origin/limits,
304 responses, legacy migration, and deletion cleanup using disposable MongoDB.

Report actual stored bytes, dimensions, selected quality, probe count, duration,
and visual observations for a large photo, transparent PNG, rotated photo, and
renamed non-image. Label generated fixtures as generated; do not claim a real
phone-photo check without a real fixture.

### Step 7 — final documentation

Update `docs/avatars-and-recovery.md` and README with API/storage changes,
migration/check commands, measured outputs, browser checklist, public-photo
behavior, and Mongo M0 considerations. The two image budgets total at most
60,000 image bytes per user, before document/index overhead. Explain that this
is not an account-capacity guarantee for a database that stores other data too.

## Assumptions and points to confirm

1. Use decimal byte limits: raw input <= 5,000,000 bytes; pixel limit 36,000,000;
   variants <= 20,000 / 40,000 bytes. Originals are never retained. Reject HEIC;
   support JPEG, PNG, WebP, and GIF's first frame consistently.
2. Uploaded pictures become public as requested, including for accounts that
   have not opted into the leaderboard. Explain that in the existing photo UI.
   Public responses contain no email or private account IDs.
3. Vercel Functions have a 4.5 MB request-body limit. The browser accepts a 5 MB
   original and uploads its pre-compressed WebP. Direct oversized requests can
   be rejected by Vercel before the application handler runs. Client fallback
   must never send the original when compression fails.
4. The five-probe rule conflicts with guaranteeing the exact highest integer
   quality across 60–85 plus arbitrary 32 px downscale retries. Proposed priority:
   hard byte budget and at most five trial encodes per variant, retaining the
   best verified passing result. If that budget is exhausted without a valid
   result, fail cleanly rather than storing an oversized image. This may leave
   an untested higher quality. Final production encodes are measured separately.
5. Cheap and final-effort encodes can differ in size. No output is saved solely
   because a probe passed; all final buffers must pass their byte checks.
6. Immutable caching applies only to matching revision URLs. Unversioned URLs,
   defaults, missing versions, and redirects use revalidation. URLs need a fresh
   revision after remove/re-upload as well as ordinary replacement; a deleted
   avatar document's reset counter alone cannot safely serve as that revision.
   Reuse existing revision metadata, and do not add image bytes to users/stats.
7. Account progress, guest storage, Judge0 execution, Foundation, ranking, and
   page layouts retain their existing behavior.

Sources checked for the plan:

- https://vercel.com/docs/functions/limitations
- https://sharp.pixelplumbing.com/api-output/
- Installed `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
