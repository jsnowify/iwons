import { errorResponse, json, requesterHash, sameOrigin, service } from "@/lib/judge0/http";
import { JudgeError } from "@/lib/judge0/errors";
import { requestUser } from "@/lib/accounts/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    sameOrigin(request);
    const { jobId } = await context.params;
    if (!/^[a-f0-9]{64}$/.test(jobId)) throw new JudgeError(404, "This judge job was not found or has expired.");
    return json(await (await service()).cancel(jobId, requesterHash(request), (await requestUser(request))?._id ?? null));
  } catch (error) { return errorResponse(error); }
}
