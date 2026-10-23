import { z } from "zod";

export const languageKey = z.enum(["java", "python", "javascript"]);
export type JudgeLanguage = z.infer<typeof languageKey>;
export const judgeRequest = z.object({
  problemId: z.string().regex(/^[a-z0-9-]{1,100}$/),
  language: languageKey,
  code: z.string().max(20_000).refine(value => value.trim().length > 0, "Enter your code first."),
  mode: z.enum(["run", "submit"]),
  // Set only for private-room judging; the server checks membership, room state and problem ownership.
  roomId: z.string().regex(/^[A-Za-z0-9_-]{16,40}$/).optional(),
}).strict();
export type JudgeRequest = z.infer<typeof judgeRequest>;
export const verdict = z.enum(["accepted", "wrong_answer", "compile_error", "runtime_error", "time_limit", "internal_error"]);
export const publicResult = z.object({
  verdict,
  failureSource: z.enum(["user", "platform"]).default("user"),
  passed: z.number().int().nonnegative(), total: z.number().int().positive(),
  runtimeMs: z.number().nonnegative(), memoryKb: z.number().nonnegative(),
  message: z.string().max(10_000),
  hiddenCases: z.array(z.object({ index: z.number().int().positive(),
    status: z.enum(["passed", "failed", "timeout", "error"]) }).strict()).optional(),
  // Only visible cases have diagnostic output.
  cases: z.array(z.object({ id: z.string(), passed: z.boolean(), stdout: z.string().max(10_000),
    error: z.string().max(10_000).optional(), runtimeMs: z.number().nonnegative() })),
});
export type PublicJudgeResult = z.infer<typeof publicResult>;
export const jobResponse = z.discriminatedUnion("state", [
  z.object({ state: z.literal("canceled") }),
  z.object({ state: z.literal("running"), done: z.number().int(), total: z.number().int() }),
  z.object({ state: z.literal("done"), result: publicResult }),
]);
export const cancelResponse = z.discriminatedUnion("state", [
  z.object({ state: z.literal("canceled"), alreadyFinished: z.literal(false) }),
  z.object({ state: z.literal("done"), alreadyFinished: z.literal(true), result: publicResult }),
]);
