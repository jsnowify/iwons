import { requireUser } from "@/lib/accounts/http";
import { deviceImport } from "@/lib/accounts/contracts";
import { database } from "@/lib/db/client";
import { accounts } from "@/lib/db/accounts";
import { judgeRepository } from "@/lib/db/judge-repository";
import { importableProblemIds } from "@/lib/accounts/catalog-ids";
import { errorResponse, json, jsonBody, sameOrigin } from "@/lib/judge0/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request); const user = await requireUser(request);
    const input = deviceImport.parse(await jsonBody(request, 4_000_000));
    const db = await database(); await judgeRepository(db).rateLimit(`import:${user._id}`, 3);
    return json(await accounts(db).merge(user._id, input.data, importableProblemIds));
  } catch (error) { return errorResponse(error, "Your sync data could not be validated. Check the backup format and size limits."); }
}
