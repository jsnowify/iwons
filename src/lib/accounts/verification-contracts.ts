import { z } from "zod";
import { languageKey } from "../judge0/contracts";
import { problemId } from "./contracts";
export const verificationCandidate = z.object({ problemId, title: z.string().max(200),
  reason: z.enum(["ready", "missing_code", "unsupported"]),
  language: languageKey.optional(), code: z.string().min(1).max(20_000).optional(),
}).strict();
export const verificationCandidates = z.object({ items: z.array(verificationCandidate).max(5000),
  concurrency: z.number().int().min(1).max(3) }).strict();
export type VerificationCandidate = z.infer<typeof verificationCandidate>;
export type VerificationStatus = "pending" | "running" | "accepted" | "needs_update";
export const verificationCache = z.object({ version: z.literal(1),
  items: z.record(problemId, z.enum(["pending", "running", "accepted", "needs_update"])),
  starts: z.array(z.number().nonnegative()).max(5), blockedUntil: z.number().nonnegative(),
}).strict();
export type VerificationCache = z.infer<typeof verificationCache>;
