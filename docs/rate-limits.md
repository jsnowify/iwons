# Rate limits

Limits are database-backed fixed-window counters (`judgeRepository(db).rateLimit(key, limit, now, cost, windowMs)` in `src/lib/db/judge-repository.ts`). A counter is shared by every serverless instance and expires through a TTL field. Refused attempts still count. A 429 carries a `Retry-After` header with the seconds left in the window and a message that matches the window (minute, hour or day).

Address-based keys use an HMAC of the client address (`TRUSTED_IP_HEADER`, or Vercel's header), never the raw address. Signed-in budgets are per account, and the address budgets for signed-in people are deliberately large so a classroom behind one network address is not locked out.

## Budgets

| Area | Key | Limit |
| --- | --- | --- |
| Sign up | address | 5 / minute, **20 / hour** |
| Log in | address | 5 / minute, **100 / hour** |
| Log in | username | 5 / minute, **30 / hour** |
| Name availability | address | 20 / minute |
| Page-load session check (`/api/auth/me`) | address | **300 / minute** |
| Password recovery reset | address, username | 5 / minute; username **20 / hour** |
| Recovery code, profile photo | account and address | 5 to 10 / minute |
| Run / Submit | account and address | 10 / 5 per minute |
| **Judge executions** (one per test case) | account | **600 / day** |
| **Judge executions** | address | **1,500 / day for guests, 6,000 / day for signed-in people** |
| Judge provider (free plan) | whole site | 30 / minute |
| Judge poll | address | 180 / minute |
| Judge cancel | address | **60 / minute** |
| Public leaderboard | address | **120 / minute** |
| Account sync, verification list, import | account | 90 / 20 / 3 per minute |
| Data export | account | **3 / minute** |
| Server submission history | account | **30 / minute** |
| Rooms: reads | account | **120 / minute** |
| Rooms: writes | account | 60 / minute |
| Rooms: create | account | 5 / minute, **20 / hour** |
| Rooms: join | account, address | 10 / minute each; account **60 / hour** |
| Rooms: invite preview | address | 60 / minute |
| Rooms: catalog search | account | **30 / minute** |
| Rooms: leaderboard | account | **60 / minute** |
| Rooms: custom problem create | account | 20 / minute, **60 / hour** |
| Rooms: validate with the judge | account | **30 / hour** |

Bold rows were added when the limits were reviewed. Before that, every limit used a one-minute window, so 5 signups a minute meant 7,200 accounts a day from one address and one account could use the free judge's 10,000 monthly executions in a few hours.

## How it behaves in production

- **Client address.** Vercel's `x-vercel-forwarded-for` is used on Vercel. On other hosts set `TRUSTED_IP_HEADER` to a header your proxy overwrites. If the header is missing or invalid, address-limited routes answer 503 instead of guessing. IPv4 is used as is, IPv4-mapped IPv6 becomes IPv4, and every other IPv6 address is limited by its /64 so one machine cannot rotate through billions of addresses (`src/lib/client-address.ts`).
- **One round trip.** Budgets that apply to the same request are charged together (`rateLimitAll`) and a refusal reports the longest wait.
- **Fails closed.** The limiter uses the same MongoDB as the data it protects. If the database is unreachable the route answers 503, never "unlimited".
- **Logging.** The first time a bucket is exhausted one line is written: `[rate-limit] blocked` with the budget name, window and limit, never an address, hash or username. Alert on a sudden rise of this line.
- **Storage.** Counters expire through the TTL index on `judge_rate_limits.expiresAt`, created by `npm run db:migrate`. Without the migration the collection grows without bound.

## Notes

- Hourly and daily budgets for the same name never share a counter with the minute budget.
- The login username limit can be used to lock out a known username for the rest of a minute or hour. That is the usual trade-off against password guessing.
- Account forms are accepted from the configured `AUTH_URL` or from the address the page was actually opened from (Origin equals Host). Other sites, missing origins and plain HTTP in production are refused. Set `AUTH_URL` to the main HTTPS address in production.
- Static pages and the CDN-cached guest leaderboard are not counted here; the limits protect the database-backed routes.

## Tests

`src/tests/rate-limits.test.ts` covers the window logic, cost accounting, `Retry-After`, the daily judge budgets, the hourly login and signup budgets, and the page-load budget. `src/tests/request-security.test.ts` covers the origin check, and `e2e/rate-limits.spec.ts` checks 429 responses over HTTP.

## Read routes use a per-instance guard

Read (GET) routes do not write to the database to count a request. They use `memoryRateLimit` (`src/lib/ratelimit/memory.ts`), a fixed-window counter held in the memory of the server instance that answers the request. It is a **per-instance soft guard, not a global limit**: each instance counts on its own, a new instance starts at zero, and counters vanish on restart. It throws the same `429` with the same message and `Retry-After` as the database limiter. It holds at most 10,000 keys and drops expired ones.

| Route | Key | Limit / minute (per instance) |
| --- | --- | --- |
| `GET /api/auth/me` | address | 300 |
| Rooms reads (mine, room, me, members, problem, custom problems) | account | 120 |
| `GET /api/rooms/[code]/leaderboard` | account | 60 |
| `GET /api/rooms/catalog` | account | 30 |
| `GET /api/leaderboard` | address | 120 |
| `GET /api/judge/[jobId]` (polling) | account, or address for guests | 180 |
| `GET /api/me/verification`, `GET /api/me/submissions` | account | 20, 30 |

Everything that writes, or that is abuse-sensitive, keeps the shared database limiter: sign in and sign up, name and handle availability, joining a room, the invite preview, the data export, judge runs and cancel, and every room write.
