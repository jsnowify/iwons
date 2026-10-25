import "server-only";
import { z } from "zod";
import type { Db } from "mongodb";
import { database } from "../db/client";
import { accountLock, accountScopeId, accountView, publicUser } from "../db/accounts";
import { CredentialError, credentialUsers } from "../db/credential-users";
import { judgeRepository, rateLimitAll, RATE_WINDOWS } from "../db/judge-repository";
import { JudgeError } from "../judge0/errors";
import { errorResponse, json, jsonBody } from "../judge0/http";
import { authConfig, type AuthConfig } from "./auth-config";
import { currentCredential } from "./current-credential";
import { accountIpHash, requireAccountOrigin } from "./request-security";
import { sessionToken, setSessionCookie } from "./session";

/** PATCH /api/me/profile/: change the username and/or display name of the signed-in credential account. */
export function profileHttp(deps: { database: () => Promise<Db>; config: () => AuthConfig; now?: () => number } = { database, config: authConfig }) {
  return async (request: Request) => {
    try {
      const config = deps.config(), now = (deps.now ?? Date.now)();
      requireAccountOrigin(request, config);
      const user = await currentCredential(request, config, deps.database, now);
      if (!user) throw new JudgeError(401, "Sign in to change your profile. Guest practice is still available.");
      const expected = request.headers.get("x-iwons-account");
      if (expected && expected !== accountScopeId(accountView(user))) throw new JudgeError(409, "Your account changed. Reload to continue.");
      const db = await deps.database(), limit = judgeRepository(db);
      await rateLimitAll(limit, [{ key: `profile:ip:${accountIpHash(request, config)}`, limit: 10 }, { key: `profile:user:${user._id}`, limit: 5 }], now);
      const body = await jsonBody(request, 2048);
      const renaming = !!body && typeof body === "object" && "username" in body && body.username !== user.username;
      if (renaming) await limit.rateLimit(`profile:rename:${user._id}`, 5, now, 1, RATE_WINDOWS.day);
      const saved = await accountLock(db, user._id, () => credentialUsers(db).updateProfile(user, body, new Date(now)));
      const result = json({ user: publicUser(accountView({ ...user, ...saved })) });
      // Sessions are signed with the username, so the browser gets a fresh one. Other devices sign in again.
      if (saved.username !== user.username)
        setSessionCookie(result, await sessionToken(saved.username, config, now, user.sessionVersion ?? 0), config, now);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = issue.path[0];
          if ((field === "username" || field === "displayName") && !fieldErrors[field]) fieldErrors[field] = issue.message;
        }
        return json({ error: Object.values(fieldErrors)[0] ?? "Change your username or display name.", fieldErrors }, 400);
      }
      if (error instanceof CredentialError) return json({ error: error.message, ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) }, error.status);
      return errorResponse(error);
    }
  };
}
export const profileEndpoint = profileHttp();
