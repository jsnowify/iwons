import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { recoveryHttp } from "@/lib/accounts/recovery-http";
import { credentialHttp } from "@/lib/accounts/credential-http";
import { currentCredential } from "@/lib/accounts/current-credential";
import { resetPasswordSchema, recoveryCodeSchema, INVALID_RECOVERY } from "@/lib/accounts/recovery-policy";
import { sessionToken } from "@/lib/accounts/session";
import { credentialUsers, type CredentialUserDoc } from "@/lib/db/credential-users";
import { createCredentialUserIndexes } from "@/lib/db/credential-user-indexes";
import type { AuthConfig } from "@/lib/accounts/auth-config";

let memory: MongoMemoryServer, client: MongoClient, db: Db, number = 0, now = Date.now(), cookie: string;
let run: ReturnType<typeof recoveryHttp>, auth: ReturnType<typeof credentialHttp>;
const config: AuthConfig = { secret: randomBytes(32), production: true, origin: "https://iwons.test", allowedOrigins: ["https://iwons.test"], trustedIpHeader: "x-test-ip" };
const details = { username: "learner_01", email: "learner@example.org", displayName: "Learner", password: "a quiet afternoon" };
const nextPassword = "a brighter tomorrow";
function request(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://iwons.test${path}`, { method: body === undefined ? "GET" : "POST", headers: {
    origin: config.origin, cookie, "x-test-ip": "192.0.2.1", ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}
const generate = (password = details.password) => run("code", request("/api/auth/recovery-code/", { password }));
const reset = (code: string, more = {}) => run("reset", request("/api/auth/reset-password/", {
  username: details.username, code, password: nextPassword, confirmPassword: nextPassword, ...more,
}));
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); client = await new MongoClient(memory.getUri()).connect(); }, 180_000);
beforeEach(async () => {
  now = Date.now(); db = client.db(`recovery_${++number}`); await createCredentialUserIndexes(db); await credentialUsers(db).create(details);
  cookie = `__Host-iwons-session=${await sessionToken(details.username, config, now)}`;
  const deps = { database: async () => db, config: () => config, now: () => now }; run = recoveryHttp(deps); auth = credentialHttp(deps);
});
afterAll(async () => { await client?.close(); await memory?.stop(); });

describe("private recovery codes", { timeout: 20_000 }, () => {
  it("requires a signed-in account, its current password, the right account scope, and an allowed origin", async () => {
    expect((await run("code", request("/", undefined, { cookie: "" }))).status).toBe(401);
    expect((await run("code", request("/", { password: details.password }, { cookie: "" }))).status).toBe(401);
    expect((await run("code", request("/", { password: details.password }, { origin: "https://evil.test" }))).status).toBe(403);
    expect((await run("code", request("/", { password: details.password }, { "x-iwons-account": "another-account" }))).status).toBe(409);
    expect((await generate("wrong password")).status).toBe(401);
    expect(await db.collection("users").countDocuments({ passwordRecovery: { $exists: true } })).toBe(0);
  });
  it("returns a random code only when generated, stores only its digest, and does not expose it in status or identity", async () => {
    const response = await generate(); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    const result = await response.json(); expect(result.code).toMatch(/^IWONS-(?:[a-f0-9]{8}-){7}[a-f0-9]{8}$/);
    const saved = await db.collection<CredentialUserDoc>("users").findOne({ username: details.username });
    expect(saved?.passwordRecovery?.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(saved)).not.toContain(result.code); expect(saved?.passwordRecovery?.hash).not.toBe(recoveryCodeSchema.parse(result.code));
    const status = await (await run("code", request("/"))).json(); expect(status).toEqual({ configured: true, expiresAt: result.expiresAt });
    expect(await (await auth("me", request("/api/auth/me/"))).json()).toEqual({ user: { username: details.username, displayName: details.displayName } });
    const newer = await (await generate()).json(); expect(newer.code).not.toBe(result.code);
    expect((await reset(result.code)).status).toBe(400); expect((await reset(newer.code)).status).toBe(200);
  });
  it("changes the password once, clears the cookie, revokes all earlier sessions, and supports a fresh login", async () => {
    const legacy = await new SignJWT({ v: 1 }).setProtectedHeader({ alg: "HS256" }).setSubject(details.username)
      .setIssuer("iwons").setAudience("iwons-web").setJti("old-session").setIssuedAt(Math.floor(now / 1000)).setExpirationTime(Math.floor(now / 1000) + 3600).sign(config.secret);
    const oldRequest = request("/", undefined, { cookie: `__Host-iwons-session=${legacy}` });
    expect(await currentCredential(oldRequest, config, async () => db, now)).not.toBeNull();
    const { code } = await (await generate()).json(); const response = await reset(code, { username: "LEARNER_01" });
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ reset: true }); expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await currentCredential(oldRequest, config, async () => db, now)).toBeNull(); expect((await auth("me", request("/"))).status).toBe(401);
    expect((await run("code", request("/"))).status).toBe(401); expect((await reset(code)).status).toBe(400);
    const repo = credentialUsers(db); await expect(repo.authenticate({ username: details.username, password: details.password })).rejects.toThrow("Username or password");
    expect(await repo.authenticate({ username: details.username, password: nextPassword })).toEqual({ username: details.username, displayName: details.displayName });
    const login = await auth("login", request("/", { username: details.username, password: nextPassword })); expect(login.status).toBe(200);
    const current = request("/", undefined, { cookie: login.headers.get("set-cookie")!.split(";")[0] }); expect((await auth("me", current)).status).toBe(200);
    const user = await db.collection<CredentialUserDoc>("users").findOne({ username: details.username }); expect(user?.sessionVersion).toBe(1); expect(user?.passwordRecovery).toBeUndefined();
  });
  it("allows only one winner under simultaneous resets with the same code", async () => {
    const { code } = await (await generate()).json();
    const results = await Promise.all([reset(code), reset(code, { password: "another quiet afternoon", confirmPassword: "another quiet afternoon" })]);
    expect(results.map(item => item.status).sort()).toEqual([200, 400]);
    const password = results[0].status === 200 ? nextPassword : "another quiet afternoon";
    await expect(credentialUsers(db).authenticate({ username: details.username, password })).resolves.toMatchObject({ username: details.username });
    expect((await db.collection<CredentialUserDoc>("users").findOne({ username: details.username }))?.sessionVersion).toBe(1);
  });
  it("rejects invalid, expired, missing, and wrong-account codes with the same safe error", async () => {
    const { code } = await (await generate()).json();
    for (const response of [await reset("0".repeat(64)), await reset(code, { username: "unknown_learner" })]) {
      expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: INVALID_RECOVERY });
    }
    await db.collection("users").updateOne({ username: details.username }, { $set: { "passwordRecovery.expiresAt": new Date(now - 1) } });
    expect(await (await reset(code)).json()).toEqual({ error: INVALID_RECOVERY });
    expect(await (await run("code", request("/"))).json()).toEqual({ configured: false, expiresAt: null });
    expect((await auth("me", request("/"))).status).toBe(200);
  });
  it("validates password strength and confirmation without consuming a valid code", async () => {
    const { code } = await (await generate()).json();
    for (const more of [{ password: "password", confirmPassword: "password" }, { password: details.username, confirmPassword: details.username }, { confirmPassword: "does not match" }])
      expect((await reset(code, more)).status).toBe(400);
    expect(resetPasswordSchema.safeParse({ username: details.username, code, password: nextPassword, confirmPassword: nextPassword, sessionVersion: 99 }).success).toBe(false);
    expect((await reset(code)).status).toBe(200);
  });
  it("limits guesses by normalized username across IPs and rejects missing/foreign origins", async () => {
    for (const origin of ["", "https://evil.test"]) expect((await run("reset", request("/", {}, { origin }))).status).toBe(403);
    for (let i = 0; i < 5; i++) expect((await run("reset", request("/", { username: details.username, code: "0".repeat(64), password: nextPassword, confirmPassword: nextPassword }, { "x-test-ip": `192.0.2.${i + 1}` }))).status).toBe(400);
    const blocked = await run("reset", request("/", { username: details.username.toUpperCase() }, { "x-test-ip": "192.0.2.99" }));
    expect(blocked.status).toBe(429); expect(blocked.headers.get("retry-after")).toBe("60");
  });
});
