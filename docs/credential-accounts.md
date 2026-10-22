# Optional username accounts

Update: Profile now supports optional photos and private recovery codes, with password reset linked from Login. See [photos and recovery](avatars-and-recovery.md) for current behavior and additive fields. Read-only-profile and deferred-recovery descriptions below record the earlier account pass.

Create an account at `/signup/`, sign in at `/login/`, and view the minimal read-only profile at `/profile/`. The header shows Sign in for guests and a profile/sign-out menu for account holders. Every challenge remains available to guests. This pass preserves Foundation, challenge grading, Judge0 execution, the editor, and leaderboard logic.

The user updated the original request to require a user-supplied email with format validation only. Email is trimmed, lowercased, unique, and never public. No placeholder email is generated. This does **not** verify ownership, mailbox existence, or deliverability. Login uses the username, not email. No OAuth or email sign-in is offered.

## Data and duplicate protection

New records contain only `_id`, `username`, `displayName`, `email`, `passwordHash`, `createdAt`, and `updatedAt`. Legacy fields are preserved. Authentication responses contain only `username` and `displayName`; the existing progress bridge uses a derived public cache scope, not a database ID.

Policy lives in `src/lib/accounts/credential-policy.ts`; Zod schemas live in `credentials.ts`. Usernames normalize to lowercase, use 3–20 ASCII letters/digits/underscores, and reject reserved names and a configured profanity list. Display names are trimmed, support readable Unicode, and default to the username. Passwords preserve whitespace, allow 8–72 Unicode characters, reject the common-password list, and cannot equal the username. Login does not reapply signup strength rules.

MongoDB unique indexes decide duplicate races; the availability check is only a hint:

- `users_username_unique_v1`: partial unique string username, case-insensitive English collation.
- `users_email_unique_v1`: partial unique string email with the same collation. Plus-addressing and provider-specific aliases are not rewritten.
- `users_provider_subject_unique_v2`: partial legacy provider/subject constraint, permitting credential records without those fields.

`src/lib/db/credential-user-indexes.ts` preflights conflicts and index drift, creates replacements before retiring the old blocking provider index, and never merges or deletes records. Existing email and handle indexes remain. Signup fails safely if required constraints are absent. The ordinary account index initializer also uses this helper.

```sh
npm run db:auth -- --check
npm run db:auth -- --apply
```

Check is read-only; apply changes only users indexes. Neither command prints user documents or secrets. On 2026-10-22 the configured Atlas database had zero users and no duplicate groups; all three indexes were applied and verified. Browser tests create accounts only in disposable local MongoDB, never Atlas.

## Sessions and API

`passwords.ts` uses Argon2id with 64 MiB memory, 3 passes, 1 lane, a 32-byte output, and a fresh random salt. Unknown usernames perform a full-cost dummy comparison. See the [Argon2 documentation](https://github.com/ranisalt/node-argon2) and [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

`session.ts` signs 30-day HS256 JWTs using jose. Cookies are HttpOnly, SameSite=Lax, scoped to `/`, and Secure with a `__Host-` name in production. Validation checks signature, expiry, issuer, audience, version, and username format. Sessions and rate counters do not depend on server memory. New auth endpoints never return passwords, hashes, email, or database IDs.

| Endpoint | Behavior |
| --- | --- |
| POST `/api/auth/signup/` | Validated signup, 201 public identity and session cookie |
| POST `/api/auth/login/` | 200 identity and cookie; unknown/wrong both return “Username or password is incorrect.” |
| POST `/api/auth/logout/` | Clear the session cookie |
| GET `/api/auth/me/` | Public identity, or 401 with `{user:null}` |
| GET `/api/username/available/?username=...` | Rate-limited availability hint |

All POSTs require an allowed Origin. Existing MongoDB atomic counters limit signup to 5/min/IP, login independently to 5/min/IP and 5/min/normalized username, and availability to 20/min/IP. Counter keys use HMACs, not raw IPs. Rejections return 429 with Retry-After. The obsolete Auth.js catch-all returns 404 and cannot bypass this flow.

## Configuration

| Server-only variable | Requirement |
| --- | --- |
| `MONGODB_URI` | Existing MongoDB connection string |
| `MONGODB_DB` | Dedicated database name; this project uses `iwons` |
| `AUTH_SECRET` | At least 32 random bytes, base64 or hex encoded; startup fails if absent/too short |
| `AUTH_URL` | Canonical origin; locally `http://localhost:3001`, HTTPS in production |
| `TRUSTED_IP_HEADER` | On non-Vercel production, a header that the proxy overwrites, stripping client copies |

Vercel uses its platform-overwritten IP header automatically. Development uses a shared local IP bucket when no trusted header is configured. Non-Vercel production account writes fail closed without a trusted IP source. Keep secrets in `.env.local` or deployment secrets, never `NEXT_PUBLIC_*`. Existing OAuth credentials are unused. CI and the browser harness generate ephemeral test secrets. Next configuration validates the shared secret decoder at startup and exits with code 1 on invalid configuration; instrumentation also validates new serverless instances.

## UI and guest data

`auth-form.tsx` shares accessible signup/login fields, inline errors, live announcements, password visibility controls, and loading/retry states. `use-username-availability.ts` debounces 400 ms, aborts stale requests, and uses icon plus text. A failed hint never blocks submission. Existing tokens, fonts, buttons, layout, dark/light themes, and reduced-motion behavior are reused.

Same-site relative return destinations retain query/hash. Unsafe destinations and auth-page loops fall back home. Logout stays on the current page, restores the existing guest namespace, and leaves guest drafts, notes, backups, and progress untouched. Credential accounts reuse existing account-scoped sync without offering guest import or legacy setup/deletion controls. Application storage access remains in `src/lib/storage.ts`.

## Verification

Implementation files:

| Area | Files |
| --- | --- |
| Validation and security | `src/lib/accounts/credential-policy.ts`, `credentials.ts`, `passwords.ts`, `auth-secret.ts`, `auth-config.ts`, `session.ts`, `return-to.ts` |
| Database | `src/lib/db/credential-users.ts`, `credential-user-indexes.ts`, `scripts/auth-indexes.ts`; compatibility edits in `db/accounts.ts` |
| API | `src/lib/accounts/credential-http.ts`, `accounts/auth.ts`, `accounts/http.ts`, five auth/availability route handlers, obsolete auth catch-all, existing `/api/me/` bridge |
| UI | `/signup/`, `/login/`, `/profile/` pages; `auth-form.tsx`, `auth-link.tsx`, `account-profile.tsx`, username-availability hook; account menu/panel/provider compatibility edits; `auth-pages.css` |
| Startup and checks | `next.config.ts`, `src/instrumentation.ts`, `.env.example`, CI ephemeral secret, credential unit/API/browser tests, isolated Playwright database harness |

No local backup schema change is needed. Existing account and guest progress use the existing versioned storage adapter.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, then browser tests. The Playwright harness seeds only disposable local MongoDB, with an ephemeral secret. Relevant browser suites are `e2e/credentials.spec.ts` and `e2e/accounts.spec.ts`.

Manual checklist on `http://localhost:3001`:

1. As a guest, open a challenge, edit a draft, and confirm Run remains available.
2. Follow Sign in, then Create an account. Enter your own email, a new username, and a passphrase. Check the username hint and show/hide control.
3. Submit; confirm the original page returns and the avatar appears. Refresh and confirm you stay signed in.
4. Open Profile; it shows username and display name. Sign out; confirm the URL stays unchanged and guest work returns.
5. Sign in with a wrong password; confirm the generic error, then retry with the correct password.
6. Sign out and try signup with the same username, then the same email. Each gets a field error; uppercase values cannot create duplicates.
7. In a private window with no cookie, browse and run a challenge. Check signup/login at 320 px in both themes and with keyboard navigation.

Automated coverage includes validation, hashing/dummy comparisons, concurrent duplicate races, index migration, rate limits, Origin rejection, cookie flags, JWT expiry/tampering, redirects, public responses, real browser signup/login/logout, mobile layouts, stale hints, retries, and guest preservation. Completed-run results are reported with the task handoff.

Completed verification on 2026-10-22:

- All 829 unit tests across 29 files passed. After extracting the shared startup decoder, all 10 auth HTTP/configuration boundary tests passed again.
- All 102 distinct browser checks passed across the account and remaining site suites. After the final mobile header change, the 5 credential checks and 10 navigation/dialog/mobile checks passed again on the rebuilt app.
- Typecheck, lint, production build, postbuild privacy checks, and SEO checks passed. SEO inspected 716 HTML files and 662 sitemap URLs; account pages are intentionally unindexed.
- Missing and short secrets both made a real `next start` process exit with code 1. The production browser flow confirmed HttpOnly/Secure/SameSite cookies, refresh persistence, logout retry and cookie clearing.
- At `http://localhost:3001`, signup/login/profile/Settings rendered without browser errors at 320 px. Live Atlas username availability and Continue as a guest worked. The final index audit still reported zero users and no pending index changes or duplicate groups.

Follow-ups: password change/recovery, email ownership verification, account deletion/settings, leaderboard opt-in, guest import, OAuth/email sign-in, Foundation changes, and a separate leaderboard pass. They are not exposed for new credential accounts.
