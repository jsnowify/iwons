import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { credentialHttp } from "@/lib/accounts/credential-http";
import { authConfig, type AuthConfig } from "@/lib/accounts/auth-config";
import { sessionToken, sessionUsername, SESSION_SECONDS } from "@/lib/accounts/session";
import { safeReturnTo } from "@/lib/accounts/return-to";
import { createCredentialUserIndexes } from "@/lib/db/credential-user-indexes";

let server: MongoMemoryServer, client: MongoClient, db: Db, run: ReturnType<typeof credentialHttp>, number = 0, fixedNow = 0;
const config: AuthConfig = { secret: randomBytes(32), origin: "https://iwons.test", allowedOrigins: ["https://iwons.test"], production: true, trustedIpHeader: "x-test-ip" };
const details = { username: "learner_01", email: "person@example.org", displayName: "A Learner", password: "a quiet afternoon" };
function request(path: string, body?: unknown, extra: Record<string, string> = {}) {
  return new Request(`https://iwons.test${path}`, { method: body === undefined ? "GET" : "POST",
    headers: { Origin: config.origin, "x-test-ip": "192.0.2.1", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
beforeAll(async () => { server = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); client = await new MongoClient(server.getUri()).connect(); }, 180_000);
beforeEach(async () => { fixedNow = Date.now(); db = client.db(`auth_http_${++number}`); await createCredentialUserIndexes(db); run = credentialHttp({ database: async () => db, config: () => config, now: () => fixedNow }); });
afterAll(async () => { await client?.close(); await server?.stop(); });

// These exercise full-cost Argon2 work against MongoDB, including dummy checks.
describe("credential HTTP endpoints", { timeout: 20_000 }, () => {
  it("signs up, sets a secure 30-day cookie, restores a session and logs out without leaking user fields", async () => {
    const created = await run("signup", request("/api/auth/signup/", details));
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ user: { username: "learner_01", displayName: "A Learner" } });
    const cookie = created.headers.get("set-cookie")!;
    for (const flag of ["__Host-iwons-session=", "HttpOnly", "Secure", "SameSite=Lax", "Path=/", `Max-Age=${SESSION_SECONDS}`])
      expect(cookie.includes(flag)).toBe(true);
    const me = await run("me", request("/api/auth/me/", undefined, { Cookie: cookie.split(";")[0] }));
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ user: { username: details.username, displayName: details.displayName } });
    expect(me.headers.get("cache-control")).toBe("no-store");
    const logout = await run("logout", request("/api/auth/logout/", {}));
    expect(logout.status).toBe(200); expect(logout.headers.get("set-cookie")!.includes("Max-Age=0")).toBe(true);
    expect((await run("me", request("/api/auth/me/"))).status).toBe(401);
  });
  it("logs in by normalized username and gives the same error for unknown users and wrong passwords", async () => {
    await run("signup", request("/api/auth/signup/", details));
    for (const username of ["learner_01", "unknown_person"]) {
      const result = await run("login", request("/api/auth/login/", { username, password: "wrong password" }));
      expect(result.status).toBe(401); expect(await result.json()).toEqual({ error: "Username or password is incorrect." });
      expect(result.headers.has("set-cookie")).toBe(false);
    }
    const loggedIn = await run("login", request("/api/auth/login/", { username: "LEARNER_01", password: details.password }));
    expect(loggedIn.status).toBe(200); expect(loggedIn.headers.has("set-cookie")).toBe(true);
  });
  it("lets exactly one concurrent signup win and returns a taken field error to the loser", async () => {
    const results = await Promise.all([run("signup", request("/api/auth/signup/", details)),
      run("signup", request("/api/auth/signup/", { ...details, username: "LEARNER_01", email: "other@example.org" }))]);
    expect(results.map(item => item.status).sort()).toEqual([201, 409]);
    expect(await results.find(item => item.status === 409)!.json()).toEqual({ error: "That username is taken.", fieldErrors: { username: "That username is taken." } });
    expect(await db.collection("users").countDocuments()).toBe(1);
  });
  it("rejects invalid signup fields on the server and keeps username availability advisory", async () => {
    const invalid = await run("signup", request("/api/auth/signup/", { ...details, email: "not-an-email", password: "password" }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).fieldErrors).toMatchObject({ email: "Enter a valid email address.", password: "Choose a less common password." });
    expect(await db.collection("users").countDocuments()).toBe(0);
    expect(await (await run("available", request("/api/username/available/?username=LEARNER_01"))).json()).toEqual({ available: true });
    await run("signup", request("/api/auth/signup/", details));
    expect(await (await run("available", request("/api/username/available/?username=learner_01"))).json()).toEqual({ available: false, reason: "taken" });
  });
  it("limits signup to five requests per IP across independent handler instances", async () => {
    for (let i = 0; i < 5; i++) {
      const invalid = await run("signup", request("/api/auth/signup/", {})); expect(invalid.status).toBe(400);
    }
    const otherInstance = credentialHttp({ database: async () => db, config: () => config, now: () => fixedNow });
    const blocked = await otherInstance("signup", request("/api/auth/signup/", details));
    expect(blocked.status).toBe(429); expect(blocked.headers.get("retry-after")).toBe("60");
  });
  it("enforces independent login budgets per IP and normalized username", async () => {
    for (let i = 0; i < 5; i++) expect((await run("login", request("/api/auth/login/", { username: "budget_user", password: "wrong" }, { "x-test-ip": `192.0.2.${i + 1}` }))).status).toBe(401);
    expect((await run("login", request("/api/auth/login/", { username: "BUDGET_USER", password: "wrong" }, { "x-test-ip": "192.0.2.99" }))).status).toBe(429);
    for (let i = 0; i < 5; i++) expect((await run("login", request("/api/auth/login/", { username: `other_user_${i}`, password: "wrong" }, { "x-test-ip": "192.0.2.77" }))).status).toBe(401);
    expect((await run("login", request("/api/auth/login/", { username: "another_user", password: "wrong" }, { "x-test-ip": "192.0.2.77" }))).status).toBe(429);
  }, 20_000);
  it("limits username hints and rejects foreign or missing origins for every POST action", async () => {
    for (const endpoint of ["signup", "login", "logout"] as const) {
      expect((await run(endpoint, request(`/api/auth/${endpoint}/`, details, { Origin: "https://evil.test" }))).status).toBe(403);
      const missing = request(`/api/auth/${endpoint}/`, details); missing.headers.delete("Origin");
      expect((await run(endpoint, missing)).status).toBe(403);
    }
    for (let i = 0; i < 20; i++) expect((await run("available", request("/api/username/available/?username=free_name"))).status).toBe(200);
    expect((await run("available", request("/api/username/available/?username=free_name"))).status).toBe(429);
  });
});
describe("session and configuration boundaries", () => {
  it("rejects missing or short secrets and untrusted public HTTP origins", () => {
    expect(() => authConfig({})).toThrow("AUTH_SECRET");
    expect(() => authConfig({ AUTH_SECRET: "short" })).toThrow("AUTH_SECRET");
    expect(() => authConfig({ AUTH_SECRET: randomBytes(32).toString("base64"), AUTH_URL: "http://evil.test" })).toThrow("HTTPS");
    expect(authConfig({ AUTH_SECRET: randomBytes(32).toString("hex"), AUTH_URL: "http://localhost:3001" }).secret.byteLength).toBe(32);
  });
  it("rejects expired, modified, or differently signed tokens and allows guests with no cookie", async () => {
    const now = Date.now();
    const token = await sessionToken("learner_01", config, now);
    const withToken = (value: string) => request("/", undefined, { Cookie: `__Host-iwons-session=${value}` });
    expect(await sessionUsername(withToken(token), config, now)).toBe("learner_01");
    expect(await sessionUsername(withToken(token), config, now + (SESSION_SECONDS + 1) * 1000)).toBeNull();
    expect(await sessionUsername(withToken(token + "changed"), config, now)).toBeNull();
    expect(await sessionUsername(withToken(token), { ...config, secret: randomBytes(32) }, now)).toBeNull();
    expect(await sessionUsername(request("/"), config)).toBeNull();
  });
  it("accepts only safe relative return paths", () => {
    for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/%2fevil.test", "/%252fevil.test", "/%0d%0aevil", "/login/", "/signup/?next=//evil", "/bad%"])
      expect(safeReturnTo(path)).toBe("/");
    expect(safeReturnTo("/problems/?q=sum#result")).toBe("/problems/?q=sum#result");
  });
});
