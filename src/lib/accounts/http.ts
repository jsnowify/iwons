import "server-only";
import { optionalUser } from "./auth";
import { JudgeError } from "../judge0/errors";
import { accountScopeId } from "../db/accounts";
export async function requestUser(request?: Request) {
  const user = await optionalUser(request);
  const expected = request?.headers.get("x-iwons-account");
  if (expected && (!user || expected !== accountScopeId(user))) throw new JudgeError(409, "Your account changed in another tab. Reload to continue; local drafts are saved.");
  return user;
}
export async function requireUser(request?: Request) {
  const user = await requestUser(request);
  if (!user) throw new JudgeError(401, "Sign in to access your account. Guest practice is still available.");
  return user;
}
