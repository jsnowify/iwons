import { database } from "@/lib/db/client";
import { leaderboard, leaderboardQuery } from "@/lib/db/leaderboard";
import { requestUser } from "@/lib/accounts/http";
import { errorResponse, json, requesterHash } from "@/lib/judge0/http";
import { memoryRateLimit } from "@/lib/ratelimit/memory";
import { Timer, routeLabel } from "@/lib/server-timing";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const timer = new Timer(routeLabel(request));
  try {
    const input = leaderboardQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
    const user = await requestUser(request);
    // Guest responses are cached by the CDN; this per-instance soft guard protects the origin from anything that gets past it.
    memoryRateLimit(`leaderboard:${requesterHash(request)}`, 120);
    const response = json(await leaderboard(await database(), input, user));
    response.headers.set("Vary", "Cookie");
    response.headers.set("Cache-Control", user ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=120");
    return timer.finish(response);
  } catch (error) { return timer.finish(errorResponse(error, "Choose a valid leaderboard, language and page size (1–100).")); }
}
