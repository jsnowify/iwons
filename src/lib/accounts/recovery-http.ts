import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import type { Db } from "mongodb";
import { database } from "../db/client";
import { accountScopeId, accountView } from "../db/accounts";
import { CredentialError, credentialUsers, type CredentialUserDoc } from "../db/credential-users";
import { CREDENTIAL_COLLATION } from "../db/credential-user-indexes";
import { judgeRepository } from "../db/judge-repository";
import { JudgeError } from "../judge0/errors";
import { json, jsonBody, errorResponse } from "../judge0/http";
import { authConfig, type AuthConfig } from "./auth-config";
import { currentCredential } from "./current-credential";
import { hashPassword } from "./passwords";
import { generateRecoverySchema, resetPasswordSchema, RECOVERY_DAYS, INVALID_RECOVERY } from "./recovery-policy";
import { accountIpHash, requireAccountOrigin } from "./request-security";
import { clearSessionCookie } from "./session";

const digest = (code: string) => createHash("sha256").update(code).digest("hex");
export function recoveryHttp(deps: { database: () => Promise<Db>; config: () => AuthConfig; now?: () => number } = { database, config: authConfig }) {
  return async (action: "code" | "reset", request: Request) => {
    try {
      const config = deps.config(), now = (deps.now ?? Date.now)();
      if (request.method !== "GET") requireAccountOrigin(request, config);
      if (action === "code") {
        const user = await currentCredential(request, config, deps.database, now);
        if (!user) throw new JudgeError(401, "Sign in to set up password recovery.");
        const expected = request.headers.get("x-iwons-account");
        if (expected && expected !== accountScopeId(accountView(user))) throw new JudgeError(409, "Your account changed. Reload to continue.");
        const db = await deps.database(), users = db.collection<CredentialUserDoc>("users");
        if (request.method === "GET") {
          const current = await users.findOne({ _id: user._id }, { projection: { "passwordRecovery.expiresAt": 1 } });
          const expires = current?.passwordRecovery?.expiresAt;
          return json({ configured: !!expires && expires.getTime() > now, expiresAt: expires && expires.getTime() > now ? expires.toISOString() : null });
        }
        const limit = judgeRepository(db);
        await limit.rateLimit(`recovery:generate:ip:${accountIpHash(request, config)}`, 5, now);
        await limit.rateLimit(`recovery:generate:user:${user._id}`, 5, now);
        const value = generateRecoverySchema.parse(await jsonBody(request, 4096));
        const authenticated = await credentialUsers(db).authenticateSession({ username: user.username, password: value.password });
        if (authenticated.sessionVersion !== (user.sessionVersion ?? 0)) throw new JudgeError(401, "Sign in again to continue.");
        const raw = randomBytes(32).toString("hex");
        const expiresAt = new Date(now + RECOVERY_DAYS * 86_400_000);
        const changed = await users.updateOne({ _id: user._id,
          $expr: { $eq: [{ $ifNull: ["$sessionVersion", 0] }, authenticated.sessionVersion] } }, {
          $set: { passwordRecovery: { version: 1, hash: digest(raw), createdAt: new Date(now), expiresAt }, updatedAt: new Date(now) },
        });
        if (changed.matchedCount !== 1) throw new JudgeError(401, "Sign in again to continue.");
        return json({ code: `IWONS-${raw.match(/.{8}/g)!.join("-")}`, expiresAt: expiresAt.toISOString() });
      }
      const db = await deps.database(), limit = judgeRepository(db);
      await limit.rateLimit(`recovery:reset:ip:${accountIpHash(request, config)}`, 5, now);
      const body = await jsonBody(request, 4096);
      const username = body && typeof body === "object" && "username" in body && typeof body.username === "string" ? body.username.toLowerCase().slice(0, 128) : "";
      const key = createHmac("sha256", config.secret).update(username).digest("hex");
      await limit.rateLimit(`recovery:reset:username:${key}`, 5, now);
      await limit.rateLimit(`recovery:reset:username:${key}`, 20, now, 1, 3_600_000);
      const value = resetPasswordSchema.parse(body), hash = digest(value.code);
      const users = db.collection<CredentialUserDoc>("users");
      const filter = { username: value.username, "passwordRecovery.version": 1, "passwordRecovery.hash": hash,
        "passwordRecovery.expiresAt": { $gt: new Date(now) } };
      const user = await users.findOne(filter, { projection: { _id: 1 }, collation: CREDENTIAL_COLLATION });
      if (!user) throw new JudgeError(400, INVALID_RECOVERY);
      const passwordHash = await hashPassword(value.password);
      // Single atomic write consumes the code and revokes every earlier JWT.
      // A concurrent reset or regenerated code makes this filter stop matching.
      const changed = await users.updateOne({ ...filter, _id: user._id,
        "passwordRecovery.expiresAt": { $gt: new Date((deps.now ?? Date.now)()) } }, {
        $set: { passwordHash, updatedAt: new Date((deps.now ?? Date.now)()) },
        $unset: { passwordRecovery: "" }, $inc: { sessionVersion: 1 },
      }, { collation: CREDENTIAL_COLLATION });
      if (changed.matchedCount !== 1) throw new JudgeError(400, INVALID_RECOVERY);
      const result = json({ reset: true }); clearSessionCookie(result, config); return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = String(issue.path[0]);
          if (["username", "code", "password", "confirmPassword"].includes(field) && !fieldErrors[field]) fieldErrors[field] = issue.message;
        }
        return json({ error: "Please check the highlighted fields.", fieldErrors }, 400);
      }
      if (error instanceof CredentialError) return json({ error: "Your current password is incorrect.", fieldErrors: { password: "Your current password is incorrect." } }, 401);
      return errorResponse(error, "Check your recovery details.");
    }
  };
}
export const recoveryEndpoint = recoveryHttp();
