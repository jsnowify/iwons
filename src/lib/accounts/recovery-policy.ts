import { z } from "zod";
import { credentialLoginSchema, credentialPasswordSchema } from "./credentials";

export const RECOVERY_DAYS = 365;
export const INVALID_RECOVERY = "That recovery code is invalid, expired, or has already been used.";
export const recoveryCodeSchema = z.string().max(160, "Enter your complete recovery code.")
  .transform(value => value.trim().replace(/^IWONS[-\s]*/i, "").replace(/[\s-]/g, "").toLowerCase())
  .pipe(z.string().regex(/^[a-f0-9]{64}$/, "Enter your complete recovery code."));
export const generateRecoverySchema = z.object({ password: credentialLoginSchema.shape.password }).strict();
export const resetPasswordSchema = z.object({ username: credentialLoginSchema.shape.username, code: recoveryCodeSchema,
  password: credentialPasswordSchema, confirmPassword: z.string().max(144, "Re-enter your new password.") }).strict()
  .superRefine((value, context) => {
    if (value.password.toLowerCase() === value.username)
      context.addIssue({ code: "custom", path: ["password"], message: "Your password must differ from your username." });
    if (value.password !== value.confirmPassword)
      context.addIssue({ code: "custom", path: ["confirmPassword"], message: "The passwords do not match." });
  });
