import { database } from "@/lib/db/client";
import { leaderboard, leaderboardQuery } from "@/lib/db/leaderboard";
import { requestUser } from "@/lib/accounts/http";
import { errorResponse, json } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const input = leaderboardQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
    const user = await requestUser(request);
    const response = json(await leaderboard(await database(), input, user));
    response.headers.set("Vary", "Cookie");
    response.headers.set("Cache-Control", user ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (error) { return errorResponse(error, "Choose a valid leaderboard, language and page size (1–100)."); }
}
