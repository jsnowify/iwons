import "server-only";
import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AuthConfig } from "./auth-config";

export const SESSION_SECONDS = 30 * 24 * 60 * 60;
const cookieName = (config: AuthConfig) => config.production ? "__Host-iwons-session" : "iwons-session";
export async function sessionToken(username: string, config: AuthConfig, now = Date.now(), sessionVersion = 0) {
  const issued = Math.floor(now / 1000);
  return new SignJWT({ v: 1, sv: sessionVersion }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(username)
    .setIssuer("iwons").setAudience("iwons-web").setJti(randomUUID()).setIssuedAt(issued)
    .setExpirationTime(issued + SESSION_SECONDS).sign(config.secret);
}
export async function sessionIdentity(request: Request, config: AuthConfig, now = Date.now()): Promise<{ username: string; version: number } | null> {
  const name = cookieName(config);
  const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  if (!cookie) return null;
  const token = cookie.slice(name.length + 1);
  if (token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, config.secret, { algorithms: ["HS256"], issuer: "iwons", audience: "iwons-web",
      requiredClaims: ["exp", "iat", "sub", "jti"], currentDate: new Date(now) });
    const version = payload.sv ?? 0;
    return payload.v === 1 && typeof payload.sub === "string" && /^[a-z0-9_]{3,20}$/.test(payload.sub) &&
      typeof version === "number" && Number.isSafeInteger(version) && version >= 0 ? { username: payload.sub, version } : null;
  } catch { return null; }
}
export async function sessionUsername(request: Request, config: AuthConfig, now = Date.now()) {
  return (await sessionIdentity(request, config, now))?.username ?? null;
}
export function setSessionCookie(response: Response, token: string, config: AuthConfig, now = Date.now()) {
  response.headers.append("Set-Cookie", `${cookieName(config)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}; Expires=${new Date(now + SESSION_SECONDS * 1000).toUTCString()}${config.production ? "; Secure" : ""}`);
}
export function clearSessionCookie(response: Response, config: AuthConfig) {
  response.headers.append("Set-Cookie", `${cookieName(config)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${config.production ? "; Secure" : ""}`);
}
