import "server-only";
import { randomUUID } from "node:crypto";
import { Binary, type Db } from "mongodb";
import { z } from "zod";
import { database } from "../db/client";
import { accountLock, accountScopeId, accountView } from "../db/accounts";
import type { CredentialUserDoc } from "../db/credential-users";
import { judgeRepository } from "../db/judge-repository";
import { JudgeError } from "../judge0/errors";
import { errorResponse, json } from "../judge0/http";
import { authConfig, type AuthConfig } from "./auth-config";
import { currentCredential } from "./current-credential";
import { accountIpHash, requireAccountOrigin } from "./request-security";
import { avatarBytes, prepareAvatar } from "./avatars";
import { avatarUrl } from "./avatar-policy";

export interface AvatarDoc { _id: string; data: Binary; version: string; updatedAt: Date }
export function avatarHttp(deps: { database: () => Promise<Db>; config: () => AuthConfig; now?: () => number } = { database, config: authConfig }) {
  return async (request: Request) => {
    try {
      const config = deps.config(), now = (deps.now ?? Date.now)();
      if (request.method !== "GET") requireAccountOrigin(request, config);
      const user = await currentCredential(request, config, deps.database, now);
      if (!user) throw new JudgeError(401, "Sign in to change your photo. Guest practice is still available.");
      const db = await deps.database();
      const expected = request.headers.get("x-iwons-account");
      if (expected && expected !== accountScopeId(accountView(user))) throw new JudgeError(409, "Your account changed. Reload to continue.");
      const avatars = db.collection<AvatarDoc>("user_avatars");
      if (request.method === "GET") {
        const image = user.avatarVersion ? await avatars.findOne({ _id: user._id }) : null;
        if (!image) throw new JudgeError(404, "No profile photo.");
        return new Response(new Uint8Array(image.data.buffer), { headers: {
          "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": 'inline; filename="avatar.webp"',
        } });
      }
      const limit = judgeRepository(db);
      await limit.rateLimit(`avatar:ip:${accountIpHash(request, config)}`, 10, now);
      await limit.rateLimit(`avatar:user:${user._id}`, 5, now);
      if (request.method === "DELETE") {
        await accountLock(db, user._id, async () => {
          await db.collection<CredentialUserDoc>("users").updateOne({ _id: user._id }, { $unset: { avatarVersion: "" }, $set: { updatedAt: new Date(now) } });
          await avatars.deleteOne({ _id: user._id });
        });
        return json({ avatarUrl: null });
      }
      const data = await prepareAvatar(await avatarBytes(request));
      const version = randomUUID().replaceAll("-", "");
      await accountLock(db, user._id, async () => {
        await avatars.replaceOne({ _id: user._id }, { version, data: new Binary(data), updatedAt: new Date(now) }, { upsert: true });
        await db.collection<CredentialUserDoc>("users").updateOne({ _id: user._id }, { $set: { avatarVersion: version, updatedAt: new Date(now) } });
      });
      return json({ avatarUrl: avatarUrl(version) });
    } catch (error) {
      if (error instanceof z.ZodError) return json({ error: "Choose a valid photo." }, 400);
      return errorResponse(error, "Choose a valid photo.");
    }
  };
}
export const avatarEndpoint = avatarHttp();
