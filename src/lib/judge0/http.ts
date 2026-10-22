import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import { JudgeError, safeError, unavailable } from "./errors";
import { database } from "../db/client";
import { judgeRepository } from "../db/judge-repository";
import { judgeClient } from "./client";
import { judgeService } from "./service";
import { recordJudged } from "../db/accounts";

export function requesterHash(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw unavailable();
  // Never trust a client-provided forwarded header unless the deployment's
  // reverse proxy is explicitly configured to overwrite it.
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_IP_HEADER;
  const address = header ? request.headers.get(header)?.split(",")[0]?.trim() : undefined;
  if (header && (!address || !isIP(address))) throw unavailable();
  if (!header && process.env.NODE_ENV === "production") throw unavailable();
  return createHmac("sha256", secret).update(address ?? "local-development").digest("hex");
}
export function sameOrigin(request: Request) {
  // Next may construct request.url with an internal localhost origin under
  // next start. The browser's Host header retains the public request authority.
  const origin = request.headers.get("origin");
  let parsed: URL | undefined;
  try { if (origin) parsed = new URL(origin); } catch { /* reject below */ }
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (!parsed || parsed.origin !== origin || parsed.host !== host || !["http:", "https:"].includes(parsed.protocol))
    throw new JudgeError(403, "Please submit code from this website.");
}
export async function jsonBody(request: Request, limit = 100_000): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new JudgeError(400, "A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new JudgeError(413, "Your request is too large."); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof JudgeError) throw error;
    throw new JudgeError(400, "Send a valid JSON request.");
  }
}
export async function service() {
  const db = await database();
  const repo = judgeRepository(db);
  return judgeService(repo, judgeClient(), async (job, result) => {
    if (!job.userId) return;
    const problem = await repo.problem(job.problemId);
    if (!problem) throw new JudgeError(404, "This problem is no longer published.");
    const weights = z.object({ easy: z.number().int().positive(), medium: z.number().int().positive(), hard: z.number().int().positive() })
      .parse(JSON.parse(process.env.POINT_WEIGHTS ?? '{"easy":1,"medium":3,"hard":5}') as unknown);
    await recordJudged(db, { _id: job._id, userId: job.userId, problemId: job.problemId,
      language: job.language, code: job.code, createdAt: job.finalizedAt ?? job.createdAt, verdict: result.verdict,
      passed: result.passed, total: result.total, runtimeMs: result.runtimeMs, memoryKb: result.memoryKb },
    weights[problem.difficulty]);
  });
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export function errorResponse(error: unknown, validationMessage = "Check the problem, language, and code (1–20,000 characters).") {
  if (error instanceof z.ZodError) return json({ error: validationMessage }, 400);
  const safe = safeError(error);
  const response = json({ error: safe.message }, safe.status);
  if (safe.status === 429) response.headers.set("Retry-After", "60");
  return response;
}
