import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import type { Db } from "mongodb";
import { database } from "../db/client";
import { credentialUsers } from "../db/credential-users";
import { CredentialError } from "../db/credential-users";
import { judgeRepository, rateLimitAll, RATE_WINDOWS } from "../db/judge-repository";
import { memoryRateLimit } from "../ratelimit/memory";
import { jsonBody } from "../judge0/http";
import { JudgeError } from "../judge0/errors";
import { authConfig, type AuthConfig } from "./auth-config";
import { INCORRECT_CREDENTIALS } from "./credentials";
import { clearSessionCookie, sessionToken, setSessionCookie } from "./session";
import { accountIpHash, requireAccountOrigin } from "./request-security";
import { currentCredential } from "./current-credential";
import { Timer } from "../server-timing";

export type CredentialEndpoint = "signup" | "login" | "logout" | "me" | "available";
const response = (value: unknown, status = 200) => Response.json(value, { status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
export function credentialHttp(deps: { database: () => Promise<Db>; config: () => AuthConfig; now?: () => number } = { database, config: authConfig }) {
  const handle = async (endpoint: CredentialEndpoint, request: Request, timer: Timer): Promise<Response> => {
    try {
      const config = deps.config();
      const now = (deps.now ?? Date.now)();
      if (["signup", "login", "logout"].includes(endpoint)) requireAccountOrigin(request, config);
      if (endpoint === "logout") {
        const result = response({ signedOut: true }); clearSessionCookie(result, config); return result;
      }
      if (endpoint === "me") {
        // Called on every page load, so the budget is generous: a classroom can share one address.
        // A per-instance soft guard: the session check is a read, so it must not cost a database write.
        memoryRateLimit(`auth:me:ip:${accountIpHash(request, config)}`, 300, now);
        const user = await timer.measure("auth_db", () => currentCredential(request, config, deps.database, now));
        return user ? response({ user: { username: user.username, displayName: user.displayName } }) : response({ user: null }, 401);
      }
      const hash = accountIpHash(request, config);
      const db = await deps.database();
      const limiter = judgeRepository(db);
      // Slower budgets stop account spam and password guessing that stays under the per-minute limit.
      await timer.measure("rate", () => rateLimitAll(limiter, [{ key: `auth:${endpoint}:ip:${hash}`, limit: endpoint === "available" ? 20 : 5 },
        ...(endpoint === "signup" ? [{ key: `auth:signup:ip:${hash}`, limit: 20, windowMs: RATE_WINDOWS.hour }] : []),
        ...(endpoint === "login" ? [{ key: `auth:login:ip:${hash}`, limit: 100, windowMs: RATE_WINDOWS.hour }] : [])], now));
      const repo = credentialUsers(db);
      if (endpoint === "available") return response(await repo.available(new URL(request.url).searchParams.get("username")));
      const body = await jsonBody(request, 4096);
      if (endpoint === "login") {
        const username = body && typeof body === "object" && "username" in body && typeof body.username === "string" ? body.username.toLowerCase().slice(0, 128) : "";
        const userHash = createHmac("sha256", config.secret).update(username).digest("hex");
        await rateLimitAll(limiter, [{ key: `auth:login:username:${userHash}`, limit: 5 },
          { key: `auth:login:username:${userHash}`, limit: 30, windowMs: RATE_WINDOWS.hour }], now);
      }
      const session = await timer.measure("hash_db", async () => endpoint === "signup" ? { user: await repo.create(body), sessionVersion: 0 } : await repo.authenticateSession(body));
      const result = response({ user: session.user }, endpoint === "signup" ? 201 : 200);
      setSessionCookie(result, await sessionToken(session.user.username, config, now, session.sessionVersion), config, now);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (endpoint === "login") return response({ error: INCORRECT_CREDENTIALS }, 401);
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && ["username", "email", "displayName", "password"].includes(field) && !fieldErrors[field]) fieldErrors[field] = issue.message;
        }
        return response({ error: "Please check the highlighted fields.", fieldErrors }, 400);
      }
      if (error instanceof CredentialError) return response({ error: error.message,
        ...(error.field ? { fieldErrors: { [error.field]: error.message } } : {}) }, error.status);
      if (error instanceof JudgeError) {
        const result = response({ error: error.message }, error.status);
        if (error.status === 429) result.headers.set("Retry-After", String(error.retryAfterSeconds ?? 60));
        return result;
      }
      return response({ error: "Account services are temporarily unavailable. Please try again." }, 503);
    }
  };
  return async (endpoint: CredentialEndpoint, request: Request) => {
    const timer = new Timer(`auth/${endpoint}`);
    return timer.finish(await handle(endpoint, request, timer));
  };
}
export const credentialEndpoint = credentialHttp();
