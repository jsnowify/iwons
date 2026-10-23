import { requireUser } from "@/lib/accounts/http";
import { database } from "@/lib/db/client";
import type { ServerSubmission } from "@/lib/db/accounts";
import { errorResponse, json } from "@/lib/judge0/http";
import { memoryRateLimit } from "@/lib/ratelimit/memory";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    memoryRateLimit(`submissions:${user._id}`, 30);
    return json(await (await database()).collection<ServerSubmission>("submissions").find({ userId: user._id },
      { projection: { userId: 0 } }).sort({ createdAt: -1 }).limit(100).toArray());
  } catch (error) { return errorResponse(error); }
}
