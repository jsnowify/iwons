import { requireUser } from "@/lib/accounts/http";
import { database } from "@/lib/db/client";
import type { ServerSubmission } from "@/lib/db/accounts";
import { errorResponse, json } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return json(await (await database()).collection<ServerSubmission>("submissions").find({ userId: user._id },
      { projection: { userId: 0 } }).sort({ createdAt: -1 }).limit(100).toArray());
  } catch (error) { return errorResponse(error); }
}
