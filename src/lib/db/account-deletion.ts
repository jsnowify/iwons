import "server-only";
import type { Db } from "mongodb";
import type { CredentialUserDoc } from "./credential-users";
import { endRoom, type MemberDoc, type RoomDoc } from "./rooms";

export const DELETED_HOST_NAME = "Deleted account";
// Every collection that stores rows under `userId`.
const USER_COLLECTIONS = ["progress", "solves", "submissions", "user_stats", "language_stats", "judge_jobs", "user_avatars"] as const;
const ROOM_COLLECTIONS = ["room_stats", "room_solves", "room_submissions"] as const;

/**
 * Removes a credential account and everything stored under it. Call inside accountLock.
 * Safe to repeat: the user row goes last, so a crash part way leaves an account that can try again.
 * The username stays reserved, because sessions are signed with it and a freed name would let an old
 * session of this person sign in as whoever claims it next.
 */
export async function deleteCredentialAccount(db: Db, user: Pick<CredentialUserDoc, "_id" | "username" | "scopeKey">, now: Date) {
  const userId = user._id;
  const retired = db.collection<{ _id: string; userId: string; at: Date }>("retired_usernames");
  for (const name of new Set([user.username, user.scopeKey ?? user.username]))
    await retired.updateOne({ _id: name }, { $setOnInsert: { userId, at: now } }, { upsert: true });

  // Rooms this person hosts are ended, which schedules their purge, and stop showing their name.
  const rooms = db.collection<RoomDoc>("rooms");
  for (const room of await rooms.find({ hostUserId: userId }).toArray()) await endRoom(db, room, now);
  await rooms.updateMany({ hostUserId: userId }, { $set: { hostName: DELETED_HOST_NAME } });

  // Leave every other room and give back the seat.
  const members = db.collection<MemberDoc>("room_members");
  const active = await members.find({ userId, status: "active" }, { projection: { roomId: 1 } }).toArray();
  if (active.length) await rooms.updateMany({ _id: { $in: active.map(member => member.roomId) }, memberCount: { $gt: 0 } }, { $inc: { memberCount: -1 } });
  await members.deleteMany({ userId });
  // `progress` and `user_avatars` are keyed by the user id itself; the rest carry it as a field.
  await Promise.all([...ROOM_COLLECTIONS, ...USER_COLLECTIONS].map(name =>
    db.collection(name).deleteMany({ $or: [{ userId }, { _id: userId as never }] })));
  await db.collection<CredentialUserDoc>("users").deleteOne({ _id: userId });
}
