import { describe, expect, it } from "vitest";
import { credentialEmailSchema, credentialLoginSchema, credentialPasswordSchema,
  credentialSignupSchema, credentialUsernameSchema, invalidUsernameReason } from "@/lib/accounts/credentials";
import { COMMON_PASSWORDS, RESERVED_USERNAMES } from "@/lib/accounts/credential-policy";
import { hashPassword, verifyPassword } from "@/lib/accounts/passwords";

const signup = { username: "Learner_01", email: " Person@Example.org ", password: "a quiet afternoon" };
describe("credential validation", () => {
  it("normalizes usernames before checking length and the allowed character set", () => {
    expect(credentialUsernameSchema.parse("LEARNER_01")).toBe("learner_01");
    for (const username of ["ab", "a".repeat(21), "has-dash", "has space", " café", "café", "$where", " learner"])
      expect(credentialUsernameSchema.safeParse(username).success).toBe(false);
    for (const username of ["abc", "a".repeat(20), "user_123"])
      expect(credentialUsernameSchema.safeParse(username).success).toBe(true);
  });
  it("blocks the configured reserved words and basic profanity after normalization", () => {
    for (const username of [...RESERVED_USERNAMES, "ADMIN", "fuck123", "some_shit", "ASSHOLE", "bitch_01"])
      expect(credentialUsernameSchema.safeParse(username).success).toBe(false);
    expect(invalidUsernameReason("a-b")).toBe("invalid");
    expect(invalidUsernameReason("ADMIN")).toBe("reserved");
    expect(invalidUsernameReason("Learner_01")).toBeNull();
    expect(credentialUsernameSchema.safeParse("classroom").success).toBe(true);
  });
  it("requires a supplied email and normalizes it without claiming ownership", () => {
    expect(credentialEmailSchema.parse(signup.email)).toBe("person@example.org");
    for (const email of [undefined, "", "not-an-email", "missing@", "a b@example.org"])
      expect(credentialSignupSchema.safeParse({ ...signup, email }).success).toBe(false);
    expect(credentialEmailSchema.parse("name+lesson@example.org")).toBe("name+lesson@example.org");
  });
  it("trims the optional display name and defaults an empty name to the username", () => {
    expect(credentialSignupSchema.parse(signup).displayName).toBe("learner_01");
    expect(credentialSignupSchema.parse({ ...signup, displayName: "   " }).displayName).toBe("learner_01");
    expect(credentialSignupSchema.parse({ ...signup, displayName: "  José 学生 😊  " }).displayName).toBe("José 学生 😊");
    expect(credentialSignupSchema.safeParse({ ...signup, displayName: "x".repeat(31) }).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...signup, displayName: "A\nB" }).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...signup, displayName: "\u200b" }).success).toBe(false);
    expect(credentialSignupSchema.parse({ ...signup, displayName: "😊".repeat(30) }).displayName).toHaveLength(60);
  });
  it("enforces password length, common-password exclusions, and username inequality", () => {
    for (const password of ["short", "x".repeat(73), ...COMMON_PASSWORDS, "PASSWORD123"])
      expect(credentialPasswordSchema.safeParse(password).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...signup, password: "LEARNER_01" }).success).toBe(false);
    for (const password of ["abcdefgh", "a".repeat(72), "😊".repeat(8), "😊".repeat(72), "all lowercase words"])
      expect(credentialPasswordSchema.safeParse(password).success).toBe(true);
    expect(credentialPasswordSchema.safeParse("😊".repeat(73)).success).toBe(false);
    const password = "  keep my spaces  ";
    expect(credentialSignupSchema.parse({ ...signup, password }).password).toBe(password);
  });
  it("rejects injected account fields and keeps login separate from signup strength policy", () => {
    for (const field of ["_id", "passwordHash", "provider", "subject", "leaderboardOptIn", "emailVerified"])
      expect(credentialSignupSchema.safeParse({ ...signup, [field]: "injected" }).success).toBe(false);
    expect(credentialLoginSchema.parse({ username: "LEARNER_01", password: "password1" }).username).toBe("learner_01");
    expect(credentialLoginSchema.safeParse({ username: { $ne: null }, password: "candidate" }).success).toBe(false);
  });
});
describe("Argon2id password hashing", () => {
  it("uses a fresh salt, preserves whitespace, and verifies correct and incorrect passwords", async () => {
    const password = "  a quiet afternoon  ";
    const first = await hashPassword(password), second = await hashPassword(password);
    const parts = first.split("$");
    expect(parts[1]).toBe("argon2id");
    expect(parts[2]).toBe("v=19");
    expect(Object.fromEntries(parts[3].split(",").map(part => part.split("="))))
      .toEqual({ m: "65536", t: "3", p: "1" });
    expect(first === password).toBe(false);
    expect(first === second).toBe(false);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword(password.trim(), first)).toBe(false);
    expect(await verifyPassword("a different password", first)).toBe(false);
    expect(await verifyPassword(password)).toBe(false);
    expect(await verifyPassword(password, "$argon2id$malformed")).toBe(false);
  }, 20_000);
});
