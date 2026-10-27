import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { deleteHttp } from "@/lib/accounts/delete-http";
import { credentialHttp } from "@/lib/accounts/credential-http";
import { sessionToken } from "@/lib/accounts/session";
import { credentialUsers, type CredentialUserDoc } from "@/lib/db/credential-users";
import { createCredentialUserIndexes } from "@/lib/db/credential-user-indexes";
import { createAccountIndexes } from "@/lib/db/accounts";
import { createRoom, createRoomIndexes, joinRoom, type RoomDoc } from "@/lib/db/rooms";
import { createRoomInput } from "@/lib/rooms/contracts";
import type { AuthConfig } from "@/lib/accounts/auth-config";

let memory: MongoMemoryServer, client: MongoClient, db: Db, number = 0, now = Date.now(), cookie: string, userId: string;
let remove: ReturnType<typeof deleteHttp>, auth: ReturnType<typeof credentialHttp>;
const config: AuthConfig = { secret: randomBytes(32), production: true, origin: "https://iwons.test", allowedOrigins: ["https://iwons.test"], trustedIpHeader: "x-test-ip" };
const details = { username: "learner_01", email: "learner@example.org", displayName: "Learner", password: "a quiet afternoon" };
let ip = 0;
function request(body?: unknown, headers: Record<string, string> = {}) {
  return new Request("https://iwons.test/api/me/", { method: "DELETE", headers: {
    origin: config.origin, cookie, "x-test-ip": `192.0.2.${++ip}`, ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}
const del = (password = details.password, headers: Record<string, string> = {}) => remove(request({ password }, headers));
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); client = await new MongoClient(memory.getUri()).connect(); }, 180_000);
beforeEach(async () => {
  now = Date.now(); db = client.db(`deletion_${++number}`);
  await Promise.all([createCredentialUserIndexes(db), createAccountIndexes(db), createRoomIndexes(db)]);
  await credentialUsers(db).create(details);
  const saved = await db.collection<CredentialUserDoc>("users").findOne({ username: details.username }); userId = saved!._id;
  cookie = `__Host-iwons-session=${await sessionToken(details.username, config, now)}`;
  const deps = { database: async () => db, config: () => config, now: () => now }; remove = deleteHttp(deps); auth = credentialHttp(deps);
});
afterAll(async () => { await client?.close(); await memory?.stop(); });

describe("credential account deletion", { timeout: 30_000 }, () => {
  it("requires a session, an allowed origin, the right account scope and the current password", async () => {
    expect((await remove(request({ password: details.password }, { cookie: "" }))).status).toBe(401);
    expect((await del(details.password, { origin: "https://evil.test" })).status).toBe(403);
    expect((await del(details.password, { "x-iwons-account": "another-account" })).status).toBe(409);
    expect((await del("wrong password")).status).toBe(401);
    expect((await remove(request({}))).status).toBe(400);
    expect(await db.collection("users").countDocuments({ _id: userId as never })).toBe(1);
  });
  it("removes the user and every row stored under them, then clears the cookie", async () => {
    const own = { userId }, other = { userId: "someone-else" };
    for (const name of ["solves", "submissions", "user_stats", "language_stats", "judge_jobs", "room_stats", "room_solves", "room_submissions"]) {
      await db.collection(name).insertMany([own, other].map(row => ({ ...row })));
    }
    await db.collection("progress").insertMany([{ _id: userId as never, userId }, { _id: "someone-else" as never, userId: "someone-else" }]);
    await db.collection("user_avatars").insertMany([{ _id: userId as never }, { _id: "someone-else" as never }]);
    const response = await del();
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ deleted: true });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await db.collection("users").countDocuments({ username: details.username })).toBe(0);
    for (const name of ["solves", "submissions", "user_stats", "language_stats", "judge_jobs", "room_stats", "room_solves", "room_submissions", "progress", "user_avatars"]) {
      expect(await db.collection(name).countDocuments({ $or: [{ userId }, { _id: userId as never }] }), name).toBe(0);
      expect(await db.collection(name).countDocuments(), name).toBe(1);
    }
  });
  it("ends the old session, refuses sign-in and keeps the username reserved", async () => {
    expect((await del()).status).toBe(200);
    expect((await auth("me", request())).status).toBe(401);
    expect((await auth("login", new Request("https://iwons.test/api/auth/login/", { method: "POST", headers: { origin: config.origin, "x-test-ip": "198.51.100.9", "content-type": "application/json" },
      body: JSON.stringify({ username: details.username, password: details.password }) }))).status).toBe(401);
    await expect(credentialUsers(db).create({ ...details, email: "new@example.org" })).rejects.toMatchObject({ code: "username_taken" });
    expect(await credentialUsers(db).available(details.username)).toEqual({ available: false, reason: "taken" });
    // The email address is free again.
    await expect(credentialUsers(db).create({ ...details, username: "learner_02" })).resolves.toMatchObject({ username: "learner_02" });
  });
  it("also reserves the first username after a rename", async () => {
    await db.collection<CredentialUserDoc>("users").updateOne({ _id: userId }, { $set: { username: "renamed_01", scopeKey: details.username } });
    cookie = `__Host-iwons-session=${await sessionToken("renamed_01", config, now)}`;
    expect((await del()).status).toBe(200);
    expect((await credentialUsers(db).available(details.username)).available).toBe(false);
    expect((await credentialUsers(db).available("renamed_01")).available).toBe(false);
  });
  it("leaves rooms it joined, ends rooms it hosts and hides the host name", async () => {
    const me = { id: userId, username: details.username, displayName: details.displayName };
    const friend = { id: "friend", username: "friend", displayName: "Friend" };
    const input = createRoomInput.parse({ name: "Study group" });
    const mine = await createRoom(db, me, input, new Date(now));
    const theirs = await createRoom(db, friend, input, new Date(now));
    await joinRoom(db, me, theirs.inviteToken, new Date(now));
    await db.collection("room_stats").insertOne({ roomId: theirs._id, userId, solved: 1 });
    expect((await del()).status).toBe(200);
    const rooms = db.collection<RoomDoc>("rooms");
    const hosted = await rooms.findOne({ _id: mine._id });
    expect(hosted).toMatchObject({ status: "ended", hostName: "Deleted account" });
    expect(hosted?.purgeAt).toBeInstanceOf(Date);
    expect(await rooms.findOne({ _id: theirs._id })).toMatchObject({ status: "active", memberCount: 1, hostName: friend.displayName });
    expect(await db.collection("room_members").countDocuments({ userId })).toBe(0);
    expect(await db.collection("room_members").countDocuments({ userId: friend.id })).toBe(1);
    expect(await db.collection("room_stats").countDocuments({ userId })).toBe(0);
  });
  it("can be repeated after an interrupted attempt", async () => {
    const response = await del();
    expect(response.status).toBe(200);
    // The account is gone, so the same cookie can no longer delete anything.
    expect((await del()).status).toBe(401);
  });
  it("rate limits repeated wrong passwords", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 7; attempt++) statuses.push((await remove(request({ password: "wrong password" }, { "x-test-ip": "203.0.113.5" }))).status);
    expect(statuses).toContain(429);
    expect(await db.collection("users").countDocuments({ username: details.username })).toBe(1);
  });
});
