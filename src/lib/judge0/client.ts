import "server-only";
import { z } from "zod";
import { busy, JudgeError, unavailable } from "./errors";

const env = z.object({
  JUDGE0_PROVIDER: z.enum(["ce", "onlinecompiler"]).default("ce"),
  JUDGE0_URL: z.url().refine(value => ["https:", "http:"].includes(new URL(value).protocol)),
  JUDGE0_AUTH_HEADER: z.string().regex(/^[A-Za-z0-9-]+$/).default("X-Auth-Token"),
  JUDGE0_AUTH_TOKEN: z.string().optional(), JUDGE0_RAPIDAPI_KEY: z.string().optional(),
  JUDGE0_RAPIDAPI_HOST: z.string().optional(),
});
export const encoded = (text: string) => Buffer.from(text, "utf8").toString("base64");
export const decoded = (text?: string | null) => text ? Buffer.from(text, "base64").toString("utf8") : "";
const outputText = z.string().max(200_000).nullable().optional();
export const judgeSubmission = z.object({
  token: z.string().min(1), status_id: z.number().int().min(1).max(14),
  stdout: outputText, stderr: outputText, compile_output: outputText, message: outputText,
  time: z.union([z.string(), z.number()]).nullable().optional(), memory: z.number().nullable().optional(),
});
export type JudgeSubmission = z.infer<typeof judgeSubmission>;
export interface JudgePayload {
  source_code: string; stdin: string; expected_output: string; language_id: number;
  cpu_time_limit: number; wall_time_limit: number; memory_limit: number; stack_limit: number;
  max_processes_and_or_threads: number; enable_per_process_and_thread_memory_limit: boolean;
  enable_network: false; max_file_size: number;
}
export interface JudgeClient {
  cacheNamespace?: string;
  maxCases?: number;
  accountRunsPerMinute?: number;
  languages(): Promise<unknown>; config(): Promise<unknown>;
  submit(payloads: JudgePayload[]): Promise<string[]>;
  read(tokens: string[]): Promise<JudgeSubmission[]>;
}
export function judgeClient(): JudgeClient {
  const config = env.safeParse(process.env);
  if (!config.success) throw unavailable();
  const settings = config.data;
  const base = new URL(settings.JUDGE0_URL.endsWith("/") ? settings.JUDGE0_URL : settings.JUDGE0_URL + "/");
  if (base.username || base.password || base.search || base.hash) throw unavailable();
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") throw unavailable();
  const freeProvider = settings.JUDGE0_PROVIDER === "onlinecompiler";
  // Its network isolation is a provider guarantee, not a request parameter.
  // Restrict that guarantee to the documented endpoint, never an arbitrary URL.
  if (freeProvider && (base.origin !== "https://api.onlinecompiler.io" || base.pathname !== "/api/judge0/")) throw unavailable();
  if (freeProvider && !settings.JUDGE0_AUTH_TOKEN?.trim()) throw unavailable();
  async function request(path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (settings.JUDGE0_AUTH_TOKEN) headers[settings.JUDGE0_AUTH_HEADER] = settings.JUDGE0_AUTH_TOKEN;
    if (settings.JUDGE0_RAPIDAPI_KEY) headers["X-RapidAPI-Key"] = settings.JUDGE0_RAPIDAPI_KEY;
    if (settings.JUDGE0_RAPIDAPI_HOST) headers["X-RapidAPI-Host"] = settings.JUDGE0_RAPIDAPI_HOST;
    let response: Response;
    try {
      response = await fetch(new URL(path, base), { method: body ? "POST" : "GET", headers,
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000), cache: "no-store", redirect: "error" });
    } catch { throw new JudgeError(503, "The judge could not be reached. Please try again."); }
    if (response.status === 429 && freeProvider) throw new JudgeError(503, "The free judge is busy or its quota has been reached. Please try again later.");
    if (response.status === 503 || response.status === 429) throw busy();
    if (!response.ok) {
      console.error("[judge] Upstream request rejected", { status: response.status });
      throw new JudgeError(503, "Execution could not start on our side. Please try again.");
    }
    try { return await response.json(); } catch { throw unavailable(); }
  }
  return {
    cacheNamespace: base.href,
    ...(freeProvider ? { maxCases: 8, accountRunsPerMinute: 30 } : {}),
    languages: () => request("languages"),
    config: () => freeProvider ? Promise.resolve({ max_cpu_time_limit: 30, max_wall_time_limit: 30,
      max_memory_limit: 512000, max_stack_limit: 128000, max_processes_and_or_threads: 16,
      max_max_file_size: 64, max_submission_batch_size: 8 }) : request("config_info"),
    async submit(payloads) {
      // OnlineCompiler rejects enable_network even when false. Its documented
      // sandbox has no network; all other limits are accepted by its adapter.
      const submissions = freeProvider ? payloads.map(({ enable_network: _network, ...payload }) => payload) : payloads;
      const parsed = z.array(z.object({ token: z.string().min(1).max(200) })).safeParse(
        await request("submissions/batch?base64_encoded=true", { submissions }));
      if (!parsed.success) throw unavailable();
      const result = parsed.data;
      if (result.length !== payloads.length) throw unavailable();
      return result.map(item => item.token);
    },
    async read(tokens) {
      const fields = "token,stdout,stderr,compile_output,message,status_id,status,time,memory";
      const parsed = z.object({ submissions: z.array(judgeSubmission) }).safeParse(await request(
        `submissions/batch?tokens=${tokens.map(encodeURIComponent).join(",")}&base64_encoded=true&fields=${fields}`));
      if (!parsed.success) throw unavailable();
      const value = parsed.data;
      const byToken = new Map(value.submissions.map(item => [item.token, item]));
      if (byToken.size !== tokens.length || tokens.some(token => !byToken.has(token))) throw unavailable();
      return tokens.map(token => byToken.get(token)!);
    },
  };
}
