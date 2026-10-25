import "server-only";
import type { Db } from "mongodb";
import type { CredentialUserDoc } from "../db/credential-users";
import { CREDENTIAL_COLLATION } from "../db/credential-user-indexes";
import type { AuthConfig } from "./auth-config";
import { sessionIdentity } from "./session";

export type CurrentCredential = Omit<CredentialUserDoc, "passwordHash" | "passwordRecovery">;
export async function currentCredential(request: Request, config: AuthConfig, database: () => Promise<Db>, now = Date.now()) {
  const session = await sessionIdentity(request, config, now);
  if (!session) return null;
  const user = await (await database()).collection<CredentialUserDoc>("users").findOne<CurrentCredential>({ username: session.username }, {
    projection: { _id: 1, username: 1, displayName: 1, email: 1, createdAt: 1, updatedAt: 1, avatarVersion: 1, sessionVersion: 1, scopeKey: 1 },
    collation: CREDENTIAL_COLLATION,
  });
  return user && (user.sessionVersion ?? 0) === session.version ? user : null;
}
