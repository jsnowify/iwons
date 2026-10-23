import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import sharp from "sharp";
import { avatarHttp } from "@/lib/accounts/avatar-http";
import { prepareAvatar } from "@/lib/accounts/avatars";
import { AVATAR_MAX_BYTES } from "@/lib/accounts/avatar-policy";
import { sessionToken } from "@/lib/accounts/session";
import { accountScopeId, accountView, publicUser } from "@/lib/db/accounts";
import type { CredentialUserDoc } from "@/lib/db/credential-users";
import type { AuthConfig } from "@/lib/accounts/auth-config";

let memory: MongoMemoryServer, client: MongoClient, db: Db, number = 0, run: ReturnType<typeof avatarHttp>, photo: Buffer, cookie: string;
const now = Date.now();
const config: AuthConfig = { secret: randomBytes(32), production: true, origin: "https://iwons.test", allowedOrigins: ["https://iwons.test"], trustedIpHeader: "x-test-ip" };
const user: CredentialUserDoc = { _id: "private-user-id", username: "learner_01", displayName: "Learner", email: "learner@example.org", passwordHash: "unchanged-hash", createdAt: new Date(now), updatedAt: new Date(now) };
function request(method = "GET", bytes?: Uint8Array, headers: Record<string, string> = {}) {
  return new Request("https://iwons.test/api/me/avatar/", { method, headers: { origin: config.origin, cookie,
    "x-test-ip": "192.0.2.1", ...(bytes ? { "content-type": "image/png" } : {}), ...headers }, body: bytes ? new Uint8Array(bytes) : undefined });
}
beforeAll(async () => {
  memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); client = await new MongoClient(memory.getUri()).connect();
  photo = await sharp({ create: { width: 600, height: 300, channels: 3, background: "#e8553d" } }).withMetadata({ orientation: 6 }).png().toBuffer();
  cookie = `__Host-iwons-session=${await sessionToken(user.username, config, now)}`;
}, 180_000);
beforeEach(async () => { db = client.db(`avatars_${++number}`); await db.collection<CredentialUserDoc>("users").insertOne({ ...user }); run = avatarHttp({ database: async () => db, config: () => config, now: () => now }); });
afterAll(async () => { await client?.close(); await memory?.stop(); });

describe("optional profile photos", () => {
  it("normalizes a photo, strips metadata, stores only the small WebP, and returns a public URL without private data", async () => {
    const saved = await run(request("PUT", photo)); expect(saved.status).toBe(200);
    const body = await saved.json(); expect(body).toEqual({ avatarUrl: expect.stringMatching(/^\/api\/me\/avatar\/\?v=[a-f0-9]{32}$/) });
    const current = await db.collection<CredentialUserDoc>("users").findOne({ _id: user._id });
    expect(current).toMatchObject({ username: user.username, email: user.email, passwordHash: user.passwordHash });
    expect(publicUser(accountView(current!)).avatarUrl).toBe(body.avatarUrl);
    const read = await run(request()); expect(read.status).toBe(200); expect(read.headers.get("content-type")).toBe("image/webp");
    expect(read.headers.get("cache-control")).toBe("private, no-store"); expect(read.headers.get("x-content-type-options")).toBe("nosniff");
    const bytes = Buffer.from(await read.arrayBuffer()), info = await sharp(bytes).metadata();
    expect([info.width, info.height, info.format]).toEqual([256, 256, "webp"]); expect(info.exif).toBeUndefined(); expect(info.orientation).toBeUndefined();
    expect(bytes.length).toBeLessThan(128 * 1024); expect(await db.collection("user_avatars").countDocuments()).toBe(1);
  });
  it("removes the stored photo and restores the initial without altering account credentials", async () => {
    await run(request("PUT", photo)); expect((await run(request("DELETE"))).status).toBe(200);
    expect((await run(request())).status).toBe(404); expect(await db.collection("user_avatars").countDocuments()).toBe(0);
    const current = await db.collection<CredentialUserDoc>("users").findOne({ _id: user._id });
    expect(current?.avatarVersion).toBeUndefined(); expect(current?.passwordHash).toBe(user.passwordHash);
    expect(publicUser(accountView(current!)).avatarUrl).toBeUndefined();
  });
  it("requires authentication, checks account scope and rejects foreign POST-like origins", async () => {
    expect((await run(request("GET", undefined, { cookie: "" }))).status).toBe(401);
    expect((await run(request("PUT", photo, { origin: "https://evil.test" }))).status).toBe(403);
    expect((await run(request("DELETE", undefined, { origin: "" }))).status).toBe(403);
    expect((await run(request("PUT", photo, { "x-iwons-account": "another-account" }))).status).toBe(409);
    expect((await run(request("PUT", photo, { "x-iwons-account": accountScopeId(accountView(user)) }))).status).toBe(200);
    const other = { ...user, _id: "another-user", username: "other_learner" }; await db.collection<CredentialUserDoc>("users").insertOne(other);
    expect((await run(request("GET", undefined, { cookie: `__Host-iwons-session=${await sessionToken(other.username, config, now)}` }))).status).toBe(404);
  });
  it("rejects fake files, vectors, truncated photos, unsupported MIME types, oversized bodies and excessive dimensions", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect((await run(request("PUT", svg))).status).toBe(400);
    expect((await run(request("PUT", photo.subarray(0, 40)))).status).toBe(400);
    expect((await run(request("PUT", photo, { "content-type": "image/svg+xml" }))).status).toBe(400);
    expect((await run(request("PUT", new Uint8Array(AVATAR_MAX_BYTES + 1)))).status).toBe(413);
    const large = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: "white" } }).png().toBuffer();
    await expect(prepareAvatar(large)).rejects.toThrow("16 megapixels");
    expect(await db.collection("user_avatars").countDocuments()).toBe(0);
  });
  it("limits profile writes per account even across handler instances", async () => {
    for (let i = 0; i < 5; i++) expect((await run(request("DELETE"))).status).toBe(200);
    const another = avatarHttp({ database: async () => db, config: () => config, now: () => now });
    const blocked = await another(request("PUT", photo)); expect(blocked.status).toBe(429); expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0); expect(Number(blocked.headers.get("retry-after"))).toBeLessThanOrEqual(60);
  });
});
