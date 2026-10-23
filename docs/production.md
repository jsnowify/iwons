# Production checklist

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | yes | At least 32 random bytes, base64 or hex. The server refuses to start without it. |
| `AUTH_URL` | yes, unless on Vercel | The site's HTTPS address, for example `https://iwons.example`. Production refuses to start without it. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` is used when it is empty. |
| `MONGODB_URI`, `MONGODB_DB` | yes | Server-side only. |
| `JUDGE0_URL`, `JUDGE0_PROVIDER`, `JUDGE0_AUTH_*` | for server judging | See `docs/judge0-setup.md`. |
| `TRUSTED_IP_HEADER` | outside Vercel | A header your reverse proxy overwrites with the real client address (`x-real-ip`, `cf-connecting-ip`). Never a header clients can set. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Used for canonical links and structured data. |

## Release steps

1. Set the variables above on the host.
2. Run `npm run db:migrate` against the production database. It is idempotent and creates the TTL, account, leaderboard and room indexes, including the rate limit counters' expiry.
3. `npm run build`, which also regenerates `public/sw.js` so the offline cache matches the new chunks.
4. Deploy, then sign up and sign in once from the production address, open `/rooms/`, and check `/api/auth/me/` answers 401 as a guest.

## Sign-in and origin checks

Account forms are accepted when the page's Origin equals the configured `AUTH_URL`, or the address the page was actually opened from (Origin equals Host over HTTPS; HTTP only outside production). Pages on other sites, missing origins and `null` are refused with 403. A wrong `AUTH_URL` therefore no longer locks people out, but it should still be set correctly for cookies, canonical links and email-free flows.

## Rate limits

See [rate-limits.md](rate-limits.md). Watch for the `[rate-limit] blocked` log line and for 503 responses from address-limited routes, which mean the trusted IP header is missing.

## Capacity notes

- Each limited request makes one or a few small MongoDB writes. On Atlas M0 (about 100 operations per second, 500 connections) keep an eye on operation counts as traffic grows, and move to a dedicated tier before it becomes the bottleneck.
- Each serverless instance holds a pool of up to 5 connections.
- The free judge provider allows 10,000 executions a month and 30 a minute across the whole site; the daily per-account budget exists to protect it.

## Route timing (opt-in, development and diagnosis only)

`src/lib/server-timing.ts` adds a `Server-Timing` header (auth, rate, db/work, total) and one `[perf]` log line per request to the account, room, leaderboard, progress and judge routes. It is **off unless `SERVER_TIMING=1`** is set, and then it is a no-op. The log line holds only the masked route name, status and durations: no payloads, identifiers or user data.

Do not set `SERVER_TIMING` in Production. Use it on a Preview deployment or locally when measuring, and remove it afterwards. The Vercel function region is set in `vercel.json` (`"regions": ["sin1"]`) to sit next to the Atlas cluster in ap-southeast-1.
