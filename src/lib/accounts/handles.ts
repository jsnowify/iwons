import "server-only";
import type { Db } from "mongodb";
import { invalidHandleReason } from "./contracts";
import type { JudgeRepository } from "../db/judge-repository";
import type { UserDoc } from "../db/accounts";

export async function handleAvailable(db: Db, limiter: JudgeRepository, handle: string, ipHash: string, userId: string | null) {
  await limiter.rateLimit(`handle:ip:${ipHash}`, 20);
  if (userId) await limiter.rateLimit(`handle:user:${userId}`, 20);
  const reason = invalidHandleReason(handle);
  if (reason) return { available: false, reason };
  const owner = await db.collection<UserDoc>("users").findOne({ handle }, { projection: { _id: 1 } });
  return owner && owner._id !== userId ? { available: false, reason: "taken" as const } : { available: true };
}
