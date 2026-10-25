import "server-only";
import { randomUUID } from "node:crypto";
import { MongoServerError, type Db } from "mongodb";
import { credentialLoginSchema, credentialProfileSchema, credentialSignupSchema, credentialUsernameSchema,
  invalidUsernameReason, INCORRECT_CREDENTIALS, type CredentialIdentity } from "../accounts/credentials";
import { passwordService, type PasswordService } from "../accounts/passwords";
import { CREDENTIAL_COLLATION, CredentialIndexError, requireCredentialUserIndexes } from "./credential-user-indexes";

export interface CredentialUserDoc {
  _id: string; username: string; displayName: string; email: string;
  passwordHash: string; createdAt: Date; updatedAt: Date; avatarVersion?: string; scopeKey?: string;
  sessionVersion?: number;
  passwordRecovery?: { version: 1; hash: string; createdAt: Date; expiresAt: Date };
}
type Failure = "username_taken" | "email_taken" | "invalid_login" | "storage_conflict";
const failures = {
  username_taken: { status: 409, message: "That username is taken.", field: "username" },
  email_taken: { status: 409, message: "That email is already in use.", field: "email" },
  invalid_login: { status: 401, message: INCORRECT_CREDENTIALS, field: undefined },
  storage_conflict: { status: 503, message: "Account creation is temporarily unavailable.", field: undefined },
} as const;
export class CredentialError extends Error {
  readonly status: number;
  readonly field: "username" | "email" | undefined;
  constructor(readonly code: Failure) {
    super(failures[code].message);
    this.name = "CredentialError";
    this.status = failures[code].status;
    this.field = failures[code].field;
  }
}
interface RetiredUsername { _id: string; userId: string; at: Date }
const identity = (user: CredentialIdentity): CredentialIdentity => ({ username: user.username, displayName: user.displayName });

export function credentialUsers(db: Db, passwords: PasswordService = passwordService) {
  const users = db.collection<CredentialUserDoc>("users");
  // A name a person gave up stays reserved. Sessions are signed with the username, so a freed name would let an old
  // session of the previous owner sign in as whoever claimed it next.
  const retired = db.collection<RetiredUsername>("retired_usernames");
  async function authenticateSession(input: unknown) {
    const parsed = credentialLoginSchema.safeParse(input);
    const user = parsed.success ? await users.findOne({ username: parsed.data.username }, {
      projection: { _id: 0, username: 1, displayName: 1, passwordHash: 1, sessionVersion: 1 }, collation: CREDENTIAL_COLLATION,
    }) : null;
    const matches = await passwords.verify(parsed.success ? parsed.data.password : "", user?.passwordHash);
    if (!parsed.success || !user || !matches) throw new CredentialError("invalid_login");
    return { user: identity(user), sessionVersion: user.sessionVersion ?? 0 };
  }
  return {
    authenticateSession,
    async available(value: unknown): Promise<{ available: boolean; reason?: "invalid" | "reserved" | "taken" }> {
      const reason = invalidUsernameReason(value);
      if (reason) return { available: false, reason };
      const username = credentialUsernameSchema.parse(value);
      const owner = await users.findOne({ username }, { projection: { _id: 1 }, collation: CREDENTIAL_COLLATION });
      if (owner || await retired.findOne({ _id: username }, { projection: { _id: 1 } })) return { available: false, reason: "taken" };
      return { available: true };
    },
    async create(input: unknown): Promise<CredentialIdentity> {
      const value = credentialSignupSchema.parse(input);
      try { await requireCredentialUserIndexes(db); }
      catch (error) {
        if (error instanceof CredentialIndexError) throw new CredentialError("storage_conflict");
        throw error;
      }
      if (await retired.findOne({ _id: value.username }, { projection: { _id: 1 } })) throw new CredentialError("username_taken");
      const passwordHash = await passwords.hash(value.password);
      const at = new Date();
      const user: CredentialUserDoc = { _id: randomUUID(), username: value.username,
        displayName: value.displayName, email: value.email, passwordHash, createdAt: at, updatedAt: at };
      try {
        // The unique indexes decide the winner. A prior availability lookup is
        // deliberately not part of this write and cannot authorize a duplicate.
        await users.insertOne(user);
      } catch (error) {
        if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
        if (error.keyPattern?.username) throw new CredentialError("username_taken");
        if (error.keyPattern?.email) throw new CredentialError("email_taken");
        throw new CredentialError("storage_conflict");
      }
      return identity(user);
    },
    /** Changes the display name and/or username. Call inside accountLock. A new username keeps the old one reserved. */
    async updateProfile(user: { _id: string; username: string; displayName: string; scopeKey?: string }, input: unknown, now = new Date()) {
      const patch = credentialProfileSchema.parse(input);
      const username = patch.username ?? user.username;
      const displayName = patch.displayName === undefined ? user.displayName : patch.displayName || username;
      const scopeKey = user.scopeKey ?? user.username;
      if (username === user.username) {
        if (displayName !== user.displayName)
          await users.updateOne({ _id: user._id }, { $set: { displayName, updatedAt: now } });
        return { username, displayName, scopeKey };
      }
      const claimed = await retired.findOne({ _id: username });
      if (claimed && claimed.userId !== user._id) throw new CredentialError("username_taken");
      await retired.updateOne({ _id: user.username }, { $setOnInsert: { userId: user._id, at: now } }, { upsert: true });
      try {
        const changed = await users.updateOne({ _id: user._id, username: user.username },
          { $set: { username, displayName, scopeKey, updatedAt: now } });
        if (changed.matchedCount !== 1) throw new CredentialError("storage_conflict");
      } catch (error) {
        await retired.deleteOne({ _id: user.username });
        if (error instanceof MongoServerError && error.code === 11000) throw new CredentialError("username_taken");
        throw error;
      }
      if (claimed) await retired.deleteOne({ _id: username });
      // Private rooms keep a copy of the name for their boards.
      await Promise.all([
        db.collection("room_members").updateMany({ userId: user._id }, { $set: { username, displayNameSnapshot: displayName } }),
        db.collection("room_stats").updateMany({ userId: user._id }, { $set: { username, displayName } }),
        db.collection("rooms").updateMany({ hostUserId: user._id }, { $set: { hostName: displayName } }),
      ]);
      return { username, displayName, scopeKey };
    },
    async authenticate(input: unknown): Promise<CredentialIdentity> {
      return (await authenticateSession(input)).user;
    },
  };
}
