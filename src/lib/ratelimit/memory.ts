import { JudgeError } from "../judge0/errors";

/**
 * Fixed-window limiter held in this server instance's memory. It is a per-instance SOFT guard for read routes,
 * not a global limit: every serverless instance counts on its own, a new instance starts at zero, and counters are
 * lost on restart. Routes that must be strictly limited (sign in, sign up, join, judge runs, anything that writes)
 * use the shared database limiter in `judgeRepository(db).rateLimit` instead.
 *
 * It answers with the same `JudgeError(429, message, retryAfterSeconds)` as the database limiter, so the status,
 * body and `Retry-After` header are identical. Refused attempts count, like they do there.
 */
interface Entry { count: number; start: number }
const MAX_KEYS = 10_000;
const WINDOW_MS = 60_000;

/** Entries are kept in the order their window began, so the oldest and the expired ones are always at the front. */
const buckets = new Map<string, Entry>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 1_000 && buckets.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.start + WINDOW_MS > now) break;
    buckets.delete(key);
  }
  // Still full of live keys (a flood of distinct keys): drop the oldest so memory stays bounded.
  while (buckets.size >= MAX_KEYS) buckets.delete(buckets.keys().next().value as string);
}

export function memoryRateLimit(key: string, limit: number, now = Date.now()) {
  sweep(now);
  const start = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  let entry = buckets.get(key);
  if (!entry || entry.start !== start) {
    // A new window moves the key to the back of the map, which keeps the map ordered by window start.
    buckets.delete(key);
    entry = { count: 0, start };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit) {
    if (entry.count - 1 <= limit) console.warn("[rate-limit] blocked", { budget: key.split(":").slice(0, 2).join(":"), window: WINDOW_MS, limit, scope: "instance" });
    const wait = Math.max(1, Math.ceil((start + WINDOW_MS - now) / 1000));
    throw new JudgeError(429, "Too many requests. Please wait a minute and try again.", wait);
  }
}

/** For tests: how many keys are held, and a way to start clean. */
export const memoryRateLimitSize = () => buckets.size;
export function resetMemoryRateLimit() { buckets.clear(); lastSweep = 0; }
