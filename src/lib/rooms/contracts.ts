import { z } from "zod";
import { cleanBlock, cleanText } from "../text";
import { languageKey } from "../judge0/contracts";

// Every bound here keeps a room's documents small and its queries indexed, so a
// room never needs a scan, a transaction or a change stream.
export const ROOM_LIMITS = Object.freeze({
  maxMembers: 100, maxProblems: 50, maxCustomProblems: 20, maxHostedActive: 10, maxCases: 20, caseChars: 10_000,
  statementChars: 10_000, starterChars: 20_000, purgeDays: 90, auditDays: 30, minCases: 2,
});
export const ROOM_CODE = /^[a-z0-9]{8}$/;
export const ROOM_ID = /^[A-Za-z0-9_-]{16,40}$/;
export const INVITE_TOKEN = /^[A-Za-z0-9_-]{22}$/;
// c-<catalog problem id> or u-<custom problem id>: also a valid judge problemId.
export const REF_KEY = /^[cu]-[a-z0-9-]{1,98}$/;
export const roomCode = z.string().regex(ROOM_CODE);
export const inviteToken = z.string().regex(INVITE_TOKEN);
export const refKey = z.string().regex(REF_KEY);
export const roomId = z.string().regex(ROOM_ID);
export const userIdParam = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/);

const line = (min: number, max: number, message: string) => z.string().max(max * 4, message).transform(value => cleanText(value, max))
  .refine(value => Array.from(value).length >= min, message);
const when = z.iso.datetime({ offset: true }).transform(value => new Date(value));
export const inviteExpiry = z.enum(["1h", "1d", "7d", "never"]);
export const expiryMs = { "1h": 3_600_000, "1d": 86_400_000, "7d": 604_800_000 } as const;
const windowCheck = (value: { startsAt?: Date | null; endsAt?: Date | null }, context: z.RefinementCtx) => {
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt)
    context.addIssue({ code: "custom", path: ["endsAt"], message: "The end must be after the start." });
};
export const createRoomInput = z.object({
  name: line(3, 60, "Use 3 to 60 characters for the room name."),
  description: z.string().max(2000).transform(value => cleanBlock(value, 500)).default(""),
  maxMembers: z.number().int().min(1).max(ROOM_LIMITS.maxMembers).default(ROOM_LIMITS.maxMembers),
  startsAt: when.optional(), endsAt: when.optional(), inviteExpiry: inviteExpiry.default("7d"),
}).strict().superRefine(windowCheck);
export const patchRoomInput = z.object({
  name: line(3, 60, "Use 3 to 60 characters for the room name.").optional(),
  description: z.string().max(2000).transform(value => cleanBlock(value, 500)).optional(),
  maxMembers: z.number().int().min(1).max(ROOM_LIMITS.maxMembers).optional(),
  startsAt: when.nullable().optional(), endsAt: when.nullable().optional(), status: z.literal("ended").optional(),
}).strict().superRefine(windowCheck);
export const regenerateInput = z.object({ expiry: inviteExpiry.default("7d") }).strict();
export const addProblemInput = z.discriminatedUnion("source", [
  z.object({ source: z.literal("catalog"), problemId: z.string().regex(/^[a-z0-9-]{1,100}$/) }).strict(),
  z.object({ source: z.literal("custom"), customProblemId: z.string().regex(/^[a-z0-9-]{1,100}$/) }).strict(),
]);
const caseText = z.string().max(ROOM_LIMITS.caseChars, "Keep each input and output under 10,000 characters.");
export const testCaseInput = z.object({ input: caseText, expectedOutput: caseText.min(1, "Every case needs an expected output."), isHidden: z.boolean() }).strict();
const testCases = z.array(testCaseInput).min(ROOM_LIMITS.minCases, "Add at least two test cases.").max(ROOM_LIMITS.maxCases, "Use at most 20 test cases.")
  .refine(items => items.some(item => !item.isHidden), "Include at least one visible example.")
  .refine(items => items.some(item => item.isHidden), "Include at least one hidden test.");
const starter = z.string().max(ROOM_LIMITS.starterChars, "Keep each starter under 20,000 characters.");
export const customProblemInput = z.object({
  title: line(3, 100, "Use 3 to 100 characters for the title."),
  statement: z.string().max(ROOM_LIMITS.statementChars * 2).transform(value => cleanBlock(value, ROOM_LIMITS.statementChars))
    .refine(value => value.length >= 10, "Describe the problem in at least 10 characters."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  starterCode: z.object({ java: starter, python: starter, javascript: starter }).strict(),
  testCases,
}).strict();
export const patchCustomProblemInput = customProblemInput.partial().strict();
export const lockedPatchInput = customProblemInput.pick({ title: true, statement: true }).partial().strict();
export const validateInput = z.object({ language: languageKey,
  code: z.string().max(20_000).refine(value => value.trim().length > 0, "Enter your reference solution first.") }).strict();
export const leaderboardInput = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().max(512).optional() });
export const catalogSearchInput = z.object({ q: z.string().max(80).default(""), limit: z.coerce.number().int().min(1).max(30).default(20) });
export type CreateRoomInput = z.infer<typeof createRoomInput>;
export type PatchRoomInput = z.infer<typeof patchRoomInput>;
export type CustomProblemInput = z.infer<typeof customProblemInput>;
