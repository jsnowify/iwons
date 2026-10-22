import { requireUser } from "@/lib/accounts/http";
import { importedVerification } from "@/lib/accounts/verification";
import { database } from "@/lib/db/client";
import { judgeRepository } from "@/lib/db/judge-repository";
import { errorResponse, json } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request), db = await database();
    await judgeRepository(db).rateLimit(`verification-list:${user._id}`, 20);
    return json(await importedVerification(db, user._id));
  } catch (error) { return errorResponse(error); }
}
