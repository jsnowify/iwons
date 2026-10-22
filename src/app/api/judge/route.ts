import { judgeRequest } from "@/lib/judge0/contracts";
import { errorResponse, json, jsonBody, requesterHash, sameOrigin, service } from "@/lib/judge0/http";
import { requestUser } from "@/lib/accounts/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = judgeRequest.parse(await jsonBody(request));
    const ipHash = requesterHash(request);
    return json(await (await service()).create(body, ipHash, (await requestUser(request))?._id ?? null), 202);
  } catch (error) { return errorResponse(error); }
}
