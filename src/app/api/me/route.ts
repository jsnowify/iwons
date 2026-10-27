import { optionalUser, enabledProviders } from "@/lib/accounts/auth";
import { requireUser } from "@/lib/accounts/http";
import { deleteEndpoint } from "@/lib/accounts/delete-http";
import { accounts, publicUser } from "@/lib/db/accounts";
import { database } from "@/lib/db/client";
import { accountPatch } from "@/lib/accounts/contracts";
import { errorResponse, json, jsonBody, sameOrigin } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await optionalUser(request);
    return json({ user: user ? publicUser(user) : null, providers: enabledProviders(), credentials: true });
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request); const user = await requireUser(request);
    if (user.username) return json({ error: "Account settings are not available yet." }, 404);
    return json(await accounts(await database()).update(user._id, accountPatch.parse(await jsonBody(request))));
  } catch (error) { return errorResponse(error, "Choose a handle with 3–20 lowercase letters, digits or underscores, and valid account preferences."); }
}
export async function DELETE(request: Request) {
  try {
    // Credential accounts confirm with their password and have their own handler.
    if ((await optionalUser(request))?.username) return await deleteEndpoint(request);
    sameOrigin(request); const user = await requireUser(request);
    await accounts(await database()).delete(user._id);
    return json({ deleted: true });
  } catch (error) { return errorResponse(error); }
}
