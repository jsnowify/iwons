# Profile photos and free password recovery

Users can add or remove a photo at `/profile/`. Password recovery uses a private code, chosen by the user instead of an email service. Login links to `/reset-password/` through **Forgot your password?** No sender, domain purchase, new API key, or environment variable is required.

## Browser checklist

1. Sign in, open the account menu, and choose **Profile**.
2. Under **Profile photo**, select a JPG, PNG, or WebP up to 2 MB, preview it, and choose **Save photo**. Check Profile, the sidebar, and the account menu, then refresh. **Remove photo** restores the initial.
3. Under **Password recovery**, enter the current password and generate a code. Copy or download it somewhere private outside this browser. It is shown only in that response and cannot be retrieved again.
4. Sign out and choose **Forgot your password?**. Supply the username, saved code, and matching new password. Successful reset consumes the code, signs out earlier sessions, and returns to normal sign-in. The old password and used code must fail; the new password must work. Generate a new code after signing back in.
5. Check at 320 px in both themes with keyboard controls. Guest practice and existing guest data remain accessible throughout.

Codes work once, expire after 365 days, and are replaced when another code is generated. A saved valid code is required for recovery. Knowing only a username or email cannot reset an account. Users without a code who still know their password can generate one from Profile.

## Photo implementation

`src/lib/accounts/avatars.ts` bounds the upload while streaming, checks raster signatures and decoded format, rejects animation and images over 16 megapixels, and re-encodes to a 256×256 WebP under 128 KB. EXIF/location metadata is stripped; original files, remote URLs, SVG, and other document formats are unsupported. The existing Sharp processor is declared directly; no UI library, fonts, image hosting, or paid storage was added.

`user_avatars` holds one binary per private user ID. The optional `users.avatarVersion` supplies a revision through the existing public account bridge. Missing versions retain initials. `GET /api/me/avatar/` serves only the current user's image with private/no-store caching and nosniff. PUT/DELETE require authentication, allowed Origin, matching account scope when supplied, and MongoDB limits of 5 writes/min/account and 10/min/IP. Existing account locks coordinate replacement/removal.

`AccountAvatar` shares photo rendering and initial fallback. `AvatarEditor` provides preview, cancel, save/remove states and errors. Identity refresh updates the header/sidebar without rewriting guest storage or running an import.

## Recovery implementation

- Native crypto generates 32 random bytes (256 bits) displayed as an `IWONS-` code. MongoDB stores only its SHA-256 digest, creation/expiry dates, and format version 1 in `users.passwordRecovery`. No plaintext code is persisted in the database, application browser storage, URL, logs, or initial HTML. Downloading a private text file is an explicit user action.
- Generation requires the signed-in account's current password, verified by the existing Argon2id service. Replacing a code uses a session-version condition, so a concurrent reset prevents the old session from creating another valid code.
- Reset validates fields and the existing password policy on the server. One atomic write changes the Argon2id hash, removes the code, and increments optional `users.sessionVersion`. Concurrent use permits exactly one winner. Invalid field values do not consume a valid code. Expiry is checked inline; no TTL index can delete user records.
- JWTs carry the session version; `current-credential.ts` compares it to the user row at authenticated entry points. Existing JWTs/records without a version mean 0, preserving them until a reset increments the version. No session records or in-memory sessions are introduced. The existing `optionalUser` bridge applies revocation to progress and judge authorization as well.
- Generation is limited to 5/min/IP and account; reset to 5/min/IP and normalized username. IP/username keys use HMACs. All POSTs require an allowed Origin. Invalid/expired/used codes share one safe error. No hashes or private user IDs are returned.
- Successful reset clears the current cookie and requires normal login. The reset page is unindexed with no-referrer metadata. Guest notes, backups, drafts and learning progress keep their current namespaces and schemas.

This follows the offline-code/session invalidation principles in [OWASP Forgot Password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). Image behavior uses [Sharp input limits](https://sharp.pixelplumbing.com/api-constructor/) and [metadata stripping](https://sharp.pixelplumbing.com/api-output/).

## Files and verification

Backend files under `src/lib/accounts/`: `avatar-policy.ts`, `avatars.ts`, `avatar-http.ts`, `recovery-policy.ts`, `recovery-http.ts`, `current-credential.ts`, and shared `request-security.ts`. Routes: `/api/me/avatar/`, `/api/auth/recovery-code/`, `/api/auth/reset-password/`. Credential repository, session module, account bridge and public account contract have additive compatibility updates.

UI: `account-avatar.tsx`, `avatar-editor.tsx`, `password-field.tsx`, `recovery-panel.tsx`, `reset-password.tsx`, plus Profile/Login, account menu/provider, sidebar and auth CSS. The SEO checker recognizes the new private page.

Tests: `src/tests/avatars.test.ts`, `src/tests/recovery.test.ts`, existing account/credential suites and `e2e/account-profile.spec.ts`. Tests use disposable local MongoDB, not Atlas. They cover photo normalization/access/limits/removal, current-password verification, hash-only storage, replacement/expiry/single use, concurrent resets, session revocation, downloads, guest compatibility, and mobile layouts.

The account browser compatibility test locates the Variables lesson by its stable destination, allowing the current module-grouped overview. Native credential HTTP tests and the Python subprocess loop have a 20-second test budget to accommodate full-suite CPU contention. Application worker termination deadlines are unchanged.

Final checks on 2026-10-22: all 844 unit tests across 31 files and all 20 selected account/profile/sidebar browser checks passed. Typecheck, lint, production build, postbuild privacy checks, and SEO passed (718 HTML files and 663 sitemap URLs). Browser coverage includes real photo storage/removal, one-time recovery downloads, password replacement, second-device session revocation, failed status checks, guest preservation, and 320 px light/dark layouts.

Earlier Resend discovery found an installed team integration, but provisioning required a sender domain and Vercel listed none. The user chose free recovery codes instead. No Resend resource, domain, SDK, key, or email delivery path was configured for this feature.
