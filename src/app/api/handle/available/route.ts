import { requestUser } from "@/lib/accounts/http";
import { handleAvailable } from "@/lib/accounts/handles";
import { database } from "@/lib/db/client";
import { judgeRepository } from "@/lib/db/judge-repository";
import { errorResponse, json, requesterHash } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requestUser(request), db = await database();
    return json(await handleAvailable(db, judgeRepository(db), new URL(request.url).searchParams.get("handle") ?? "", requesterHash(request), user?._id ?? null));
  } catch (error) { return errorResponse(error); }
}
