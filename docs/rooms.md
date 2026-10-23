# Private rooms

Signed-in users can create a private room, pick the problems, invite people with a generated link and see a leaderboard that belongs to that room alone. Guests can open an invite link and see the room name, host and seat count, then sign up to join. Everything else on Iwons stays open to guests.

Room results never count toward the global leaderboard, `user_stats`, `language_stats`, the global solved count or local progress. The room home says so.

## Decisions that were not in the brief

- **Catalog problems are judged through an adapter.** All 500 catalog problems are function-style (JSON arguments in, a value out) and are graded in the browser for guests. The judge only runs stdin/stdout programs, so each catalog problem is wrapped on the server (`src/lib/rooms/catalog.ts`): the wrapper reads one JSON case, calls the learner's function, compares the result and prints `PASS` or `FAIL`. The expected value travels inside stdin and never reaches the browser. 445 of 500 problems are eligible. The 55 that convert lists or trees, or use a custom comparison, are not offered, and catalog problems support JavaScript and Python only. Java works for custom problems. A test runs every eligible reference solution, visible and hidden cases, through the exact wrapper text in both languages.
- **Hidden catalog cases stay private.** They are read on the server from `src/data/problems/**` (`privateData.hiddenCases`), not from the public `public/problem-data` copy.
- **Free judge limit.** The free provider accepts 8 cases per job. For catalog problems the server keeps every example and spreads the hidden checks to fit (`fitCases`). Custom problems are not trimmed: a host with more than 8 cases sees the provider's message when validating. The judge budget (10,000 executions a month, 30 a minute) is shared with all other server judging.
- **First accept is claimed atomically.** Instead of detecting a new insert from an upsert, `room_solves` rows exist from the first attempt (`firstAcceptedAt: null`) and the first accept is `findOneAndUpdate({ firstAcceptedAt: null })`. Only one concurrent finalizer can win, and the standing is recomputed from the member's own solve rows with `$max`, so replays and crashes repair themselves and two problems finishing at once cannot overwrite each other.
- **Ranking time** is the time of a member's latest *new* solve, measured from `startsAt` (or the room's creation time). Members with no solves are not ranked.
- **Additive fields:** `rooms.inviteVersion` (a kicked member may rejoin only through a link regenerated after the removal), `rooms.hostName`, `rooms.problemCount/customCount/nextOrder` (atomic caps and ordering), `rooms.purgeAt`, `room_problems.locked` (set on first submission, blocks removal), `custom_problems.testsHash` (validation applies only to the exact tests that were run) and `purgeAt` on every child collection. A TTL index needs a date field, so `endsAt + 90 days` is stored as `purgeAt` when a room ends.
- **Limits** that keep documents bounded: 50 problems and 20 custom problems per room, 10 active hosted rooms per user.
- **Room problems are never added to local submissions**, so they cannot appear in local or global stats.

## Data

`rooms`, `room_members`, `room_problems`, `custom_problems`, `room_solves`, `room_stats`, `room_submissions` (30-day TTL, no source code). Indexes are created by `createRoomIndexes` and run by `npm run db:migrate`. `judge_jobs` gained optional `roomId`, `problemRefKey`, `purpose` and `testsHash`.

## Serverless safety

Single-document atomic operations only. Joining reserves a seat with `findOneAndUpdate({ status: "active", $expr: memberCount < maxMembers })`, inserts the member, and releases the seat on a duplicate key. A crash between those steps is repaired by `repairMemberCount` whenever the host loads the room. The leaderboard reads the `(roomId, solved, lastAcceptedAt, userId)` index and is never cached.

## API

All routes need a signed-in credential account and send `Cache-Control: no-store`. Writes check the origin and are rate limited.

| Route | Who |
| --- | --- |
| `POST /api/rooms`, `GET /api/rooms/mine` | account |
| `GET /api/rooms/catalog?q=` | account (eligible catalog problems) |
| `GET/PATCH /api/rooms/[code]` | member / host |
| `POST /api/rooms/[code]/invite/regenerate` | host |
| `GET/POST /api/rooms/join/[inviteToken]` | preview is public; join needs an account (10/min per user and per IP) |
| `POST /api/rooms/[code]/leave` | member |
| `GET /api/rooms/[code]/members`, `POST .../members/[userId]/kick` | member / host (only the host receives user ids) |
| `POST /api/rooms/[code]/problems`, `GET/DELETE .../problems/[refKey]` | host / member / host |
| `GET/POST .../custom-problems`, `GET/PATCH .../custom-problems/[id]`, `POST .../[id]/validate` | host |
| `GET .../leaderboard`, `GET .../me` | member |
| `POST /api/judge` with `roomId` | member; checks membership, an active started room, and that the problem belongs to the room |

Non-members receive the same 404 as a missing room.

## Pages

`/rooms` (Hosting and Joined), `/rooms/new`, `/rooms/[code]` (Problems, Leaderboard, Members; host also Settings and Invite), `/rooms/[code]/problems/[refKey]`, `/rooms/[code]/custom/[id|new]`, `/rooms/join/[inviteToken]`. All are `noindex`, outside the sitemap and never cached by the offline service worker.

## Verification

- `src/tests/rooms.test.ts` (real MongoDB): capacity race at the limit (40 joins into 4 seats), one person joining repeatedly, kicked members and regenerated links, expiry, permissions, per-host room limit, problem caps, removal guard, hidden tests never returned, tests lock, validation tied to the tests hash, idempotent solves under 12 concurrent finalizers, two problems finishing together, global collections untouched, ended rooms and removed members ignored, 90-day purge fields, ranking and cursor pagination.
- `src/tests/room-judge.test.ts`: the real judge service end to end with the real resolver, wrapper, grading and effects. Only the remote executor is replaced by a local one.
- `src/tests/room-catalog.test.ts`: every eligible catalog reference solution passes every case in JavaScript and Python through the wrapper.
- `e2e/rooms.spec.ts`: guest gate and invite preview, form, regenerate, join, leave, removal, full and ended rooms, judge request shape, no local progress changes, custom editor and validation states, 320px layout.

## Check in a browser

1. Sign in, open **Rooms**, create a room, open Invite and copy the link.
2. In a private window open the link: the room name, host and seats show, nothing about the problems. Sign up there and join.
3. As host, add a catalog problem and write a custom one. Validate it with a reference solution (needs the live judge), then add it.
4. As the member, open a problem, Run and Submit, and watch the Leaderboard tab.
5. Remove the member, regenerate the link, end the room, and confirm Submit is closed.

## Follow-ups

- Live judge: the browser tests mock the provider, so a real Submit through the free provider has not been run end to end.
- Deleting a credential account does not yet leave or end its rooms (account deletion is not available for credential accounts).
- Catalog problems that convert lists or trees, and Java for catalog problems, need typed adapters.
- Members cannot be re-added individually; they need a new invite link after a removal.
