import { requireUser } from "@/lib/accounts/http";
import { progressPatch } from "@/lib/accounts/contracts";
import { database } from "@/lib/db/client";
import { accounts } from "@/lib/db/accounts";
import { judgeRepository } from "@/lib/db/judge-repository";
import { importableProblemIds } from "@/lib/accounts/catalog-ids";
import { errorResponse, json, jsonBody, sameOrigin } from "@/lib/judge0/http";
import { Timer, routeLabel } from "@/lib/server-timing";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const timer = new Timer(routeLabel(request));
  try {
    const user = await timer.measure("auth", () => requireUser(request));
    return timer.finish(json(await timer.measure("work", async () => accounts(await database()).progress(user._id))));
  } catch (error) { return timer.finish(errorResponse(error, "Your sync data could not be validated. Check the backup format and size limits.")); }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request); const user = await requireUser(request);
    const db = await database(); await judgeRepository(db).rateLimit(`sync:${user._id}`, 90);
    return json(await accounts(db).merge(user._id, progressPatch.parse(await jsonBody(request, 4_000_000)), importableProblemIds));
  } catch (error) { return errorResponse(error, "Your sync data could not be validated. Check the backup format and size limits."); }
}
