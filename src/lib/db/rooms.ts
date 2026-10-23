import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import type { Db } from "mongodb";
import { JudgeError } from "../judge0/errors";
import { ROOM_LIMITS, expiryMs, type CreateRoomInput, type PatchRoomInput } from "../rooms/contracts";

export interface Person { id: string; username: string; displayName: string }
export interface RoomDoc {
  _id: string; code: string; name: string; description: string; hostUserId: string; hostName: string;
  status: "active" | "ended"; maxMembers: number; memberCount: number; startsAt: Date | null; endsAt: Date | null;
  inviteToken: string; inviteExpiresAt: Date | null; inviteVersion: number;
  problemCount: number; customCount: number; nextOrder: number;
  endedAt?: Date; purgeAt?: Date; purgeMarked?: boolean; createdAt: Date; updatedAt: Date;
}
export interface MemberDoc { roomId: string; userId: string; role: "host" | "member"; status: "active" | "kicked";
  joinedAt: Date; username: string; displayNameSnapshot: string; kickedInviteVersion?: number; kickedAt?: Date; purgeAt?: Date }
export type ProblemRef = { source: "catalog"; problemId: string } | { source: "custom"; customProblemId: string };
export interface RoomProblemDoc { roomId: string; problemRef: ProblemRef; refKey: string; order: number; title: string;
  difficulty: "easy" | "medium" | "hard"; addedAt: Date; locked?: boolean; purgeAt?: Date }
export interface CustomCase { input: string; expectedOutput: string; isHidden: boolean; order: number }
export interface CustomProblemDoc { _id: string; roomId: string; createdByUserId: string; title: string; statement: string;
  difficulty: "easy" | "medium" | "hard"; starterCode: { java: string; python: string; javascript: string };
  testCases: CustomCase[]; testsHash: string; validated: boolean; testsLocked: boolean; createdAt: Date; updatedAt: Date; purgeAt?: Date }
export interface RoomSolveDoc { roomId: string; userId: string; problemRefKey: string; firstAcceptedAt: Date | null;
  lastAcceptedAt: Date | null; bestRuntimeMs?: number; language?: string; attemptCount: number; purgeAt?: Date }
export interface RoomStatsDoc { roomId: string; userId: string; username: string; displayName: string; solved: number;
  lastAcceptedAt: Date | null; updatedAt: Date; purgeAt?: Date }
export interface RoomSubmissionDoc { _id: string; roomId: string; userId: string; problemRefKey: string; verdict: string;
  passed: number; total: number; createdAt: Date; expiresAt: Date }

const day = 86_400_000;
export const isDuplicate = (error: unknown) => error instanceof Error && "code" in error && error.code === 11000;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
export const newRoomId = () => randomBytes(16).toString("base64url");
export const newInviteToken = () => randomBytes(16).toString("base64url");
export const newRoomCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const CHILDREN = ["room_members", "room_problems", "custom_problems", "room_solves", "room_stats"] as const;

export async function createRoomIndexes(db: Db) {
  const ttl = { expireAfterSeconds: 0 };
  await Promise.all([
    db.collection("rooms").createIndex({ code: 1 }, { unique: true }),
    db.collection("rooms").createIndex({ inviteToken: 1 }, { unique: true }),
    db.collection("rooms").createIndex({ hostUserId: 1, status: 1 }),
    db.collection("rooms").createIndex({ purgeAt: 1 }, ttl),
    db.collection("room_members").createIndex({ roomId: 1, userId: 1 }, { unique: true }),
    db.collection("room_members").createIndex({ roomId: 1, joinedAt: 1 }),
    db.collection("room_members").createIndex({ userId: 1, status: 1, joinedAt: -1 }),
    db.collection("room_members").createIndex({ purgeAt: 1 }, ttl),
    db.collection("room_problems").createIndex({ roomId: 1, order: 1 }, { unique: true }),
    db.collection("room_problems").createIndex({ roomId: 1, refKey: 1 }, { unique: true }),
    db.collection("room_problems").createIndex({ purgeAt: 1 }, ttl),
    db.collection("custom_problems").createIndex({ roomId: 1 }),
    db.collection("custom_problems").createIndex({ purgeAt: 1 }, ttl),
    db.collection("room_solves").createIndex({ roomId: 1, userId: 1, problemRefKey: 1 }, { unique: true }),
    db.collection("room_solves").createIndex({ roomId: 1, firstAcceptedAt: 1 }),
    db.collection("room_solves").createIndex({ purgeAt: 1 }, ttl),
    db.collection("room_stats").createIndex({ roomId: 1, userId: 1 }, { unique: true }),
    db.collection("room_stats").createIndex({ roomId: 1, solved: -1, lastAcceptedAt: 1, userId: 1 }),
    db.collection("room_stats").createIndex({ purgeAt: 1 }, ttl),
    db.collection("room_submissions").createIndex({ expiresAt: 1 }, ttl),
    db.collection("room_submissions").createIndex({ roomId: 1, userId: 1, createdAt: -1 }),
  ]);
}

export const effectiveStatus = (room: Pick<RoomDoc, "status" | "endsAt">, now: Date): "active" | "ended" =>
  room.status === "ended" || (room.endsAt && room.endsAt <= now) ? "ended" : "active";
export const hasStarted = (room: Pick<RoomDoc, "startsAt">, now: Date) => !room.startsAt || room.startsAt <= now;
const gone = () => new JudgeError(404, "This room was not found, or you are not a member of it.");

/** Ends a room (idempotently) and schedules every child document for deletion 90 days later. */
export async function endRoom(db: Db, room: RoomDoc, now: Date): Promise<RoomDoc> {
  const purgeAt = new Date(now.getTime() + ROOM_LIMITS.purgeDays * day);
  const rooms = db.collection<RoomDoc>("rooms");
  const ended = await rooms.findOneAndUpdate({ _id: room._id, status: "active" },
    { $set: { status: "ended", endedAt: now, purgeAt, updatedAt: now } }, { returnDocument: "after" });
  const current = ended ?? await rooms.findOne({ _id: room._id });
  if (!current) throw gone();
  if (!current.purgeMarked) {
    // Bounded: every child collection is indexed by roomId and capped by the room limits.
    await Promise.all(CHILDREN.map(name => db.collection(name).updateMany({ roomId: room._id }, { $set: { purgeAt: current.purgeAt ?? purgeAt } })));
    await rooms.updateOne({ _id: room._id }, { $set: { purgeMarked: true } });
    return { ...current, purgeMarked: true };
  }
  return current;
}
/** Lazily ends a room whose end time has passed. */
export async function settleRoom(db: Db, room: RoomDoc, now: Date): Promise<RoomDoc> {
  if ((room.status === "active" && room.endsAt && room.endsAt <= now) || (room.status === "ended" && !room.purgeMarked)) return endRoom(db, room, now);
  return room;
}

export async function createRoom(db: Db, host: Person, input: CreateRoomInput, now: Date) {
  const rooms = db.collection<RoomDoc>("rooms");
  if (await rooms.countDocuments({ hostUserId: host.id, status: "active" }) >= ROOM_LIMITS.maxHostedActive)
    throw new JudgeError(409, "You are hosting the maximum number of active rooms. End one to create another.");
  if (input.endsAt && input.endsAt <= now) throw new JudgeError(400, "Choose an end time in the future.");
  const expires = input.inviteExpiry === "never" ? null : new Date(now.getTime() + expiryMs[input.inviteExpiry]);
  for (let attempt = 0; attempt < 5; attempt++) {
    const room: RoomDoc = { _id: newRoomId(), code: newRoomCode(), name: input.name, description: input.description, hostUserId: host.id,
      hostName: host.displayName, status: "active", maxMembers: input.maxMembers, memberCount: 1, startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null, inviteToken: newInviteToken(), inviteExpiresAt: expires, inviteVersion: 1,
      problemCount: 0, customCount: 0, nextOrder: 1, createdAt: now, updatedAt: now };
    try { await rooms.insertOne(room); } catch (error) { if (isDuplicate(error)) continue; throw error; }
    await db.collection<MemberDoc>("room_members").insertOne({ roomId: room._id, userId: host.id, role: "host", status: "active",
      joinedAt: now, username: host.username, displayNameSnapshot: host.displayName });
    return room;
  }
  throw new JudgeError(503, "We could not create the room. Please try again.");
}

/** Loads a room for an active member; anyone else gets the same 404 so rooms cannot be probed. */
export async function memberContext(db: Db, code: string, userId: string, now: Date) {
  const found = await db.collection<RoomDoc>("rooms").findOne({ code });
  if (!found) throw gone();
  const member = await db.collection<MemberDoc>("room_members").findOne({ roomId: found._id, userId, status: "active" });
  if (!member) throw gone();
  const room = await settleRoom(db, found, now);
  return { room, member, status: effectiveStatus(room, now), isHost: member.role === "host" };
}
export async function hostContext(db: Db, code: string, userId: string, now: Date) {
  const context = await memberContext(db, code, userId, now);
  if (!context.isHost) throw new JudgeError(403, "Only the room host can do that.");
  return context;
}
export function requireActive(status: string) { if (status !== "active") throw new JudgeError(409, "This room has ended. It is read-only now."); }

export async function updateRoom(db: Db, room: RoomDoc, patch: PatchRoomInput, now: Date) {
  requireActive(effectiveStatus(room, now));
  const { status, ...fields } = patch;
  const set: Record<string, unknown> = { updatedAt: now };
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) set[key] = value;
  const startsAt = patch.startsAt === undefined ? room.startsAt : patch.startsAt, endsAt = patch.endsAt === undefined ? room.endsAt : patch.endsAt;
  if (startsAt && endsAt && endsAt <= startsAt) throw new JudgeError(400, "The end must be after the start.");
  if (patch.endsAt && patch.endsAt <= now) throw new JudgeError(400, "Choose an end time in the future.");
  const filter: Record<string, unknown> = { _id: room._id, status: "active" };
  if (patch.maxMembers !== undefined) filter.memberCount = { $lte: patch.maxMembers };
  if (Object.keys(set).length > 1) {
    const changed = await db.collection<RoomDoc>("rooms").findOneAndUpdate(filter, { $set: set }, { returnDocument: "after" });
    if (!changed) throw new JudgeError(409, patch.maxMembers !== undefined && patch.maxMembers < room.memberCount
      ? "You already have more members than that. Remove members first." : "This room could not be updated. Reload and try again.");
    room = changed;
  }
  return status === "ended" ? endRoom(db, room, now) : room;
}

export async function regenerateInvite(db: Db, room: RoomDoc, expiry: keyof typeof expiryMs | "never", now: Date) {
  requireActive(effectiveStatus(room, now));
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const next = await db.collection<RoomDoc>("rooms").findOneAndUpdate({ _id: room._id, status: "active" }, {
        $set: { inviteToken: newInviteToken(), inviteExpiresAt: expiry === "never" ? null : new Date(now.getTime() + expiryMs[expiry]), updatedAt: now },
        $inc: { inviteVersion: 1 } }, { returnDocument: "after" });
      if (!next) throw new JudgeError(409, "This room has ended.");
      return next;
    } catch (error) { if (!isDuplicate(error)) throw error; }
  }
  throw new JudgeError(503, "We could not create a new link. Please try again.");
}

export function inviteState(room: RoomDoc, now: Date): "ok" | "expired" | "ended" | "full" {
  if (effectiveStatus(room, now) === "ended") return "ended";
  if (room.inviteExpiresAt && room.inviteExpiresAt <= now) return "expired";
  if (room.memberCount >= room.maxMembers) return "full";
  return "ok";
}
export async function invitePreview(db: Db, token: string, now: Date) {
  const room = await db.collection<RoomDoc>("rooms").findOne({ inviteToken: token });
  if (!room) throw new JudgeError(404, "This invite link is not valid. Ask the host for a new one.");
  // Deliberately nothing about problems: titles and statements stay private until a person joins.
  return { name: room.name, hostName: room.hostName, memberCount: room.memberCount, maxMembers: room.maxMembers, state: inviteState(room, now) };
}

const JOIN_MESSAGES = { expired: "This invite link has expired. Ask the host for a new one.", ended: "This room has ended.",
  full: "This room is full.", revoked: "This invite link was replaced. Ask the host for the new one." } as const;
export async function joinRoom(db: Db, person: Person, token: string, now: Date) {
  const rooms = db.collection<RoomDoc>("rooms"), members = db.collection<MemberDoc>("room_members");
  const room = await rooms.findOne({ inviteToken: token });
  if (!room) throw new JudgeError(404, JOIN_MESSAGES.revoked);
  const existing = await members.findOne({ roomId: room._id, userId: person.id });
  if (existing?.status === "active") return { code: room.code, alreadyMember: true };
  if (existing?.status === "kicked" && (existing.kickedInviteVersion ?? 0) >= room.inviteVersion)
    throw new JudgeError(403, "You were removed from this room. Ask the host for a new invite link.");
  const state = inviteState(room, now);
  if (state !== "ok") throw new JudgeError(state === "full" ? 409 : 410, JOIN_MESSAGES[state]);
  // One atomic step reserves a seat only while the room is active, the link is current and capacity remains.
  const reserved = await rooms.findOneAndUpdate({ _id: room._id, status: "active", inviteToken: token,
    $expr: { $lt: ["$memberCount", "$maxMembers"] }, $and: [{ $or: [{ inviteExpiresAt: null }, { inviteExpiresAt: { $gt: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] }] }, { $inc: { memberCount: 1 } });
  if (!reserved) {
    const fresh = await rooms.findOne({ _id: room._id });
    const state = fresh && fresh.inviteToken === token ? inviteState(fresh, now) : "revoked";
    if (state === "ok") throw new JudgeError(503, "Please try again.");
    throw new JudgeError(state === "full" ? 409 : state === "revoked" ? 404 : 410, JOIN_MESSAGES[state]);
  }
  const release = () => rooms.updateOne({ _id: room._id, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
  try {
    if (existing) {
      const revived = await members.updateOne({ roomId: room._id, userId: person.id, status: "kicked" }, { $set: { status: "active", joinedAt: now,
        username: person.username, displayNameSnapshot: person.displayName }, $unset: { kickedInviteVersion: "", kickedAt: "" } });
      if (revived.matchedCount !== 1) { await release(); return { code: room.code, alreadyMember: true }; }
    } else await members.insertOne({ roomId: room._id, userId: person.id, role: "member", status: "active", joinedAt: now,
      username: person.username, displayNameSnapshot: person.displayName });
  } catch (error) {
    await release();
    if (!isDuplicate(error)) throw error;
    const raced = await members.findOne({ roomId: room._id, userId: person.id });
    if (raced?.status === "active") return { code: room.code, alreadyMember: true };
    throw new JudgeError(403, "You were removed from this room. Ask the host for a new invite link.");
  }
  return { code: room.code, alreadyMember: false };
}

async function dropStanding(db: Db, roomId: string, userId: string) {
  await Promise.all([db.collection("room_stats").deleteOne({ roomId, userId }), db.collection("room_solves").deleteMany({ roomId, userId })]);
}
export async function leaveRoom(db: Db, room: RoomDoc, userId: string) {
  if (room.hostUserId === userId) throw new JudgeError(409, "Hosts cannot leave. End the room instead.");
  const removed = await db.collection<MemberDoc>("room_members").findOneAndDelete({ roomId: room._id, userId, status: "active", role: "member" });
  if (removed) {
    await db.collection<RoomDoc>("rooms").updateOne({ _id: room._id, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
    await dropStanding(db, room._id, userId);
  }
  return { left: true };
}
export async function kickMember(db: Db, room: RoomDoc, targetUserId: string, now: Date) {
  if (targetUserId === room.hostUserId) throw new JudgeError(400, "The host cannot be removed.");
  const kicked = await db.collection<MemberDoc>("room_members").findOneAndUpdate({ roomId: room._id, userId: targetUserId, status: "active", role: "member" },
    { $set: { status: "kicked", kickedInviteVersion: room.inviteVersion, kickedAt: now } });
  if (!kicked) throw new JudgeError(404, "That member was not found.");
  await db.collection<RoomDoc>("rooms").updateOne({ _id: room._id, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
  await dropStanding(db, room._id, targetUserId);
  return { removed: true };
}
/** Repairs a counter left behind by a crash between reserving a seat and inserting the member. */
export async function repairMemberCount(db: Db, room: RoomDoc): Promise<RoomDoc> {
  const actual = await db.collection<MemberDoc>("room_members").countDocuments({ roomId: room._id, status: "active" });
  if (actual === room.memberCount) return room;
  await db.collection<RoomDoc>("rooms").updateOne({ _id: room._id }, { $set: { memberCount: actual } });
  return { ...room, memberCount: actual };
}
export async function roomMembers(db: Db, roomId: string) {
  return db.collection<MemberDoc>("room_members").find({ roomId, status: "active" }).sort({ joinedAt: 1 }).limit(ROOM_LIMITS.maxMembers).toArray();
}
export async function myRooms(db: Db, userId: string, now: Date) {
  const memberships = await db.collection<MemberDoc>("room_members").find({ userId, status: "active" }).sort({ joinedAt: -1 }).limit(100).toArray();
  const rooms = memberships.length ? await db.collection<RoomDoc>("rooms").find({ _id: { $in: memberships.map(item => item.roomId) } }).toArray() : [];
  const byId = new Map(rooms.map(room => [room._id, room]));
  return memberships.flatMap(member => { const room = byId.get(member.roomId); return room ? [{ room, role: member.role, status: effectiveStatus(room, now) }] : []; });
}
