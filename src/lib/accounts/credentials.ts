import { z } from "zod";
import { COMMON_PASSWORDS, PROFANE_USERNAME_PARTS, RESERVED_USERNAMES } from "./credential-policy";
import { cleanLine } from "../text";

const usernameFormat = z.string().toLowerCase().min(3, "Use 3 to 20 characters.")
  .max(20, "Use 3 to 20 characters.")
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only.");
const blockedUsername = (value: string) => RESERVED_USERNAMES.includes(value) ||
  PROFANE_USERNAME_PARTS.some(word => value.includes(word));
export const credentialUsernameSchema = usernameFormat.refine(value => !blockedUsername(value), "Choose a different username.");
export function invalidUsernameReason(value: unknown): "invalid" | "reserved" | null {
  const parsed = usernameFormat.safeParse(value);
  return !parsed.success ? "invalid" : blockedUsername(parsed.data) ? "reserved" : null;
}
export const credentialEmailSchema = z.string().trim().toLowerCase().max(254, "Enter a valid email address.")
  .pipe(z.email({ error: "Enter a valid email address." }));
const characterCount = (value: string) => Array.from(value).length;
// Names are shown on leaderboards, so hidden and bidirectional characters that
// could spoof another player are removed before the length and content checks.
const displayNameSchema = z.string().max(200, "Use at most 30 characters.")
  // Control characters (such as line breaks) and names made only of invisible characters are rejected.
  .refine(value => !/\p{Cc}/u.test(value.trim()) && (value.trim() === "" || cleanLine(value) !== ""), "Use readable text for your display name.")
  .transform(cleanLine)
  .refine(value => characterCount(value) <= 30, "Use at most 30 characters.");
// Count Unicode characters rather than UTF-8 bytes. Argon2 does not truncate
// passwords at bcrypt's 72-byte boundary; whitespace is intentionally preserved.
export const credentialPasswordSchema = z.string().max(144, "Use 8 to 72 characters.")
  .refine(value => characterCount(value) >= 8 && characterCount(value) <= 72, "Use 8 to 72 characters.")
  .refine(value => !COMMON_PASSWORDS.includes(value.toLowerCase()), "Choose a less common password.");
export const credentialSignupSchema = z.object({
  username: credentialUsernameSchema, email: credentialEmailSchema,
  displayName: displayNameSchema.optional(), password: credentialPasswordSchema,
}).strict().superRefine((value, context) => {
  if (value.password.toLowerCase() === value.username)
    context.addIssue({ code: "custom", path: ["password"], message: "Your password must differ from your username." });
}).transform(value => ({ ...value, displayName: value.displayName || value.username }));
// Login must not reapply signup strength rules: changing the common-password
// list later must not lock out an existing account with an unchanged password.
export const credentialLoginSchema = z.object({ username: usernameFormat,
  password: z.string().min(1).max(144).refine(value => characterCount(value) <= 72),
}).strict();
export type CredentialSignup = z.output<typeof credentialSignupSchema>;
export interface CredentialIdentity { username: string; displayName: string }
export const INCORRECT_CREDENTIALS = "Username or password is incorrect.";
