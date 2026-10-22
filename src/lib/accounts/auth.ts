import "server-only";
import { headers } from "next/headers";
import { database } from "../db/client";
import { accountView, type UserDoc } from "../db/accounts";
import { authConfig } from "./auth-config";
import { currentCredential } from "./current-credential";

export function enabledProviders(): string[] { return []; }
export async function optionalUser(request?: Request): Promise<UserDoc | null> {
  const config = authConfig();
  const current = request ?? new Request(config.origin, { headers: await headers() });
  const user = await currentCredential(current, config, database);
  return user ? accountView(user) : null;
}
