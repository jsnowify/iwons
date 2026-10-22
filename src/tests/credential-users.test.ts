import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { credentialUsers, type CredentialUserDoc } from "@/lib/db/credential-users";
import { createCredentialUserIndexes, inspectCredentialUserIndexes } from "@/lib/db/credential-user-indexes";
import { createAccountIndexes } from "@/lib/db/accounts";
import { passwordService } from "@/lib/accounts/passwords";
import { INCORRECT_CREDENTIALS } from "@/lib/accounts/credentials";

let memory: MongoMemoryServer, client: MongoClient, db: Db, number = 0;
beforeAll(async () => {
  memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } });
  client = await new MongoClient(memory.getUri()).connect();
}, 180_000);
beforeEach(() => { db = client.db(`credential_test_${++number}`); });
afterAll(async () => { await client?.close(); await memory?.stop(); });
const details = (username = "learner_01", email = "person@example.org") => ({ username, email, password: "a quiet afternoon" });

describe("authoritative credential user repository", () => {
  it("refuses signups when the required unique indexes were not installed", async () => {
    const hash = vi.fn(passwordService.hash);
    const repo = credentialUsers(db, { hash, verify: passwordService.verify });
    await expect(repo.create(details())).rejects.toMatchObject({ code: "storage_conflict", status: 503 });
    expect(hash).not.toHaveBeenCalled();
    expect(await db.collection("users").countDocuments()).toBe(0);
  });
  it("stores only the requested fields and returns a public identity without sensitive fields", async () => {
    await createCredentialUserIndexes(db);
    const repo = credentialUsers(db);
    const created = await repo.create({ ...details("LEARNER_01", " Person@Example.org "), displayName: "  Learner One  " });
    expect(created).toEqual({ username: "learner_01", displayName: "Learner One" });
    const user = await db.collection<CredentialUserDoc>("users").findOne({ username: "learner_01" });
    expect(Object.keys(user!).sort()).toEqual(["_id", "createdAt", "displayName", "email", "passwordHash", "updatedAt", "username"]);
    expect(user!.email).toBe("person@example.org");
    expect(user!.passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(user!.passwordHash === details().password).toBe(false);
    expect(user!.createdAt).toBeInstanceOf(Date);
    expect(user!.updatedAt.getTime()).toBe(user!.createdAt.getTime());
    expect(await repo.authenticate({ username: "LEARNER_01", password: details().password })).toEqual(created);
  });
  it("accepts exactly one of two simultaneous signups for the same normalized username", async () => {
    await createCredentialUserIndexes(db);
    const first = credentialUsers(db), second = credentialUsers(db);
    expect(await first.available("RACE_USER")).toEqual({ available: true });
    expect(await second.available("race_user")).toEqual({ available: true });
    const result = await Promise.allSettled([
      first.create(details("RACE_USER", "first@example.org")), second.create(details("race_user", "second@example.org")),
    ]);
    expect(result.filter(item => item.status === "fulfilled")).toHaveLength(1);
    const failure = result.find(item => item.status === "rejected") as PromiseRejectedResult;
    expect(failure.reason).toMatchObject({ code: "username_taken", status: 409, message: "That username is taken." });
    expect(await db.collection("users").countDocuments()).toBe(1);
    expect(await first.available("RaCe_UsEr")).toEqual({ available: false, reason: "taken" });
    expect(await first.available("admin")).toEqual({ available: false, reason: "reserved" });
    expect(await first.available("a-b")).toEqual({ available: false, reason: "invalid" });
  });
  it("enforces email uniqueness across simultaneous signups after normalizing case and spaces", async () => {
    await createCredentialUserIndexes(db);
    const repo = credentialUsers(db);
    const result = await Promise.allSettled([
      repo.create(details("first_person", " Person@Example.org ")), repo.create(details("second_person", "person@example.org")),
    ]);
    expect(result.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect((result.find(item => item.status === "rejected") as PromiseRejectedResult).reason)
      .toMatchObject({ code: "email_taken", status: 409 });
    expect(await db.collection("users").countDocuments()).toBe(1);
  });
  it("keeps username and email uniqueness case-insensitive even for a direct database write", async () => {
    await createCredentialUserIndexes(db);
    await credentialUsers(db).create(details());
    const users = db.collection<CredentialUserDoc>("users");
    const original = (await users.findOne({ username: "learner_01" }))!;
    await expect(users.insertOne({ ...original, _id: randomUUID(), username: "LEARNER_01", email: "other@example.org" })).rejects.toMatchObject({ code: 11000 });
    await expect(users.insertOne({ ...original, _id: randomUUID(), username: "other_person", email: "PERSON@EXAMPLE.ORG" })).rejects.toMatchObject({ code: 11000 });
    expect(await users.countDocuments()).toBe(1);
  });
  it("uses the same generic failure for an unknown user, wrong password, and invalid login input", async () => {
    await createCredentialUserIndexes(db);
    const verify = vi.fn(passwordService.verify);
    const repo = credentialUsers(db, { hash: passwordService.hash, verify });
    await repo.create(details());
    for (const input of [{ username: "learner_01", password: "wrong password" },
      { username: "unknown_person", password: "wrong password" }, { username: { $ne: null }, password: "wrong password" }]) {
      await expect(repo.authenticate(input)).rejects.toMatchObject({ code: "invalid_login", status: 401, message: INCORRECT_CREDENTIALS });
    }
    expect(verify.mock.calls.map(([, stored]) => typeof stored === "string")).toEqual([true, false, false]);
  // Real Argon2 comparisons share CPU with the full suite; keep their cost intact.
  }, 20_000);
  it("validates required email and all server fields before hashing or writing", async () => {
    await createCredentialUserIndexes(db);
    const hash = vi.fn(passwordService.hash);
    const repo = credentialUsers(db, { hash, verify: passwordService.verify });
    for (const input of [{ username: "learner_01", password: details().password },
      { ...details(), email: "invalid" }, { ...details(), passwordHash: "injected" }, { ...details(), username: "admin" }])
      await expect(repo.create(input)).rejects.toMatchObject({ name: "ZodError" });
    expect(hash).not.toHaveBeenCalled();
    expect(await db.collection("users").countDocuments()).toBe(0);
  });
});

describe("non-destructive user index migration", () => {
  it("preserves existing OAuth fields and builds a partial replacement before retiring its blocking index", async () => {
    const users = db.collection<{ _id: string; [key: string]: unknown }>("users");
    await users.createIndex({ provider: 1, subject: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ handle: 1 }, { unique: true, sparse: true });
    await users.insertMany([
      { _id: "legacy-one", provider: "github", subject: "one", email: "legacy1@example.org", name: "Existing", handle: "existing_one", image: "E", leaderboardOptIn: false, extraField: "retained" },
      { _id: "legacy-two", provider: "google", subject: "two", email: "legacy2@example.org", name: "Existing too", image: "E", leaderboardOptIn: false },
    ]);
    const before = await users.find().sort({ _id: 1 }).toArray();
    const plan = await inspectCredentialUserIndexes(db);
    expect(plan.retire).toEqual(["provider_1_subject_1"]);
    const after = await createCredentialUserIndexes(db);
    expect(after.create).toEqual([]); expect(after.retire).toEqual([]);
    expect(await users.find().sort({ _id: 1 }).toArray()).toEqual(before);
    const actual = await users.listIndexes().toArray();
    expect(actual.map(index => index.name)).toContain("email_1");
    expect(actual.map(index => index.name)).toContain("handle_1");
    expect(actual.find(index => index.name === "users_provider_subject_unique_v2")?.partialFilterExpression)
      .toEqual({ provider: { $type: "string" }, subject: { $type: "string" } });
    await credentialUsers(db).create(details("new_one", "new1@example.org"));
    await credentialUsers(db).create(details("new_two", "new2@example.org"));
    await createAccountIndexes(db);
    await createCredentialUserIndexes(db);
    expect((await inspectCredentialUserIndexes(db)).create).toEqual([]);
    expect(await users.countDocuments()).toBe(4);
  });
  it("refuses to remove or merge pre-existing duplicate records", async () => {
    const users = db.collection("users");
    await users.insertMany([{ username: "Mixed_Case", email: "first@example.org" }, { username: "mixed_case", email: "second@example.org" }]);
    const before = await users.find().toArray();
    expect((await inspectCredentialUserIndexes(db)).conflicts.username).toBe(1);
    await expect(createCredentialUserIndexes(db)).rejects.toMatchObject({ name: "CredentialIndexError" });
    expect(await users.find().toArray()).toEqual(before);
    expect((await users.listIndexes().toArray()).map(index => index.name)).toEqual(["_id_"]);
  });
  it("rejects unexpected index configuration before changing the collection", async () => {
    const users = db.collection("users");
    await users.createIndex({ username: 1 }, { name: "users_username_unique_v1" });
    await expect(createCredentialUserIndexes(db)).rejects.toMatchObject({ name: "CredentialIndexError" });
    expect((await users.listIndexes().toArray()).map(index => index.name)).toEqual(["_id_", "users_username_unique_v1"]);
  });
});
