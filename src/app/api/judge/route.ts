import { judgeRequest } from "@/lib/judge0/contracts";
import { errorResponse, json, jsonBody, requesterHash, sameOrigin, service } from "@/lib/judge0/http";
import { requestUser } from "@/lib/accounts/http";
import { Timer, routeLabel } from "@/lib/server-timing";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const timer = new Timer(routeLabel(request));
  try {
    sameOrigin(request);
    const body = judgeRequest.parse(await jsonBody(request));
    const ipHash = requesterHash(request);
    const userId = (await timer.measure("auth", () => requestUser(request)))?._id ?? null;
    return timer.finish(json(await timer.measure("create", async () => (await service()).create(body, ipHash, userId)), 202));
  } catch (error) { return timer.finish(errorResponse(error)); }
}
