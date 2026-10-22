import "server-only";
import { randomBytes } from "node:crypto";
import { argon2id, hash, verify } from "argon2";

const options = Object.freeze({ type: argon2id, memoryCost: 65_536, timeCost: 3,
  parallelism: 1, hashLength: 32 });
export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, encodedHash?: string): Promise<boolean>;
}
export function hashPassword(password: string) { return hash(password, options); }
// Not a user account or session. Both known and unknown login attempts await
// the same initialization, then perform a full Argon2 comparison at equal cost.
let dummyHash: Promise<string> | undefined;
function comparisonHash() {
  return dummyHash ??= hashPassword(randomBytes(32).toString("base64"));
}
export async function verifyPassword(password: string, encodedHash?: string) {
  const dummy = await comparisonHash();
  if (!encodedHash?.startsWith("$argon2id$")) {
    await verify(dummy, password);
    return false;
  }
  try { return await verify(encodedHash, password); }
  catch {
    // A malformed stored hash must not turn into a fast username lookup.
    await verify(dummy, password);
    return false;
  }
}
export const passwordService: PasswordService = { hash: hashPassword, verify: verifyPassword };
