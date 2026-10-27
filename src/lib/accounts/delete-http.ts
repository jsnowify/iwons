import "server-only";
import { z } from "zod";
import type { Db } from "mongodb";
import { database } from "../db/client";
import { accountLock, accountScopeId, accountView } from "../db/accounts";
import { deleteCredentialAccount } from "../db/account-deletion";
import { CredentialError, credentialUsers } from "../db/credential-users";
import { judgeRepository } from "../db/judge-repository";
import { JudgeError } from "../judge0/errors";
import { errorResponse, json, jsonBody } from "../judge0/http";
import { authConfig, type AuthConfig } from "./auth-config";
import { currentCredential } from "./current-credential";
import { generateRecoverySchema } from "./recovery-policy";
import { accountIpHash, requireAccountOrigin } from "./request-security";
import { clearSessionCookie } from "./session";

/** DELETE /api/me/: permanently removes the signed-in credential account after re-entering its password. */
export function deleteHttp(deps: { database: () => Promise<Db>; config: () => AuthConfig; now?: () => number } = { database, config: authConfig }) {
  return async (request: Request) => {
    try {
      const config = deps.config(), now = (deps.now ?? Date.now)();
      requireAccountOrigin(request, config);
      const user = await currentCredential(request, config, deps.database, now);
      if (!user) throw new JudgeError(401, "Sign in to delete your account.");
      const expected = request.headers.get("x-iwons-account");
      if (expected && expected !== accountScopeId(accountView(user))) throw new JudgeError(409, "Your account changed. Reload to continue.");
      const db = await deps.database(), limit = judgeRepository(db);
      await limit.rateLimit(`delete:ip:${accountIpHash(request, config)}`, 5, now);
      await limit.rateLimit(`delete:user:${user._id}`, 5, now);
      const value = generateRecoverySchema.parse(await jsonBody(request, 4096));
      const authenticated = await credentialUsers(db).authenticateSession({ username: user.username, password: value.password });
      if (authenticated.sessionVersion !== (user.sessionVersion ?? 0)) throw new JudgeError(401, "Sign in again to continue.");
      await accountLock(db, user._id, () => deleteCredentialAccount(db, user, new Date(now)));
      const result = json({ deleted: true }); clearSessionCookie(result, config); return result;
    } catch (error) {
      if (error instanceof z.ZodError) return json({ error: "Enter your current password.", fieldErrors: { password: "Enter your current password." } }, 400);
      if (error instanceof CredentialError) return json({ error: "Your current password is incorrect.", fieldErrors: { password: "Your current password is incorrect." } }, 401);
      return errorResponse(error);
    }
  };
}
export const deleteEndpoint = deleteHttp();
