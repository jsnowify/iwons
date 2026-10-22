import { errorResponse, json, requesterHash, service } from "@/lib/judge0/http";
import { JudgeError } from "@/lib/judge0/errors";
import { requestUser } from "@/lib/accounts/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await context.params;
    if (!/^[a-f0-9]{64}$/.test(jobId)) throw new JudgeError(404, "This judge job was not found or has expired.");
    const ipHash = requesterHash(request);
    return json(await (await service()).poll(jobId, ipHash, (await requestUser(request))?._id ?? null));
  } catch (error) { return errorResponse(error); }
}
