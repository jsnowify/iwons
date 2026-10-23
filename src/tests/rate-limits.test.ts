import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { judgeDemoProblem } from "../../scripts/curriculum/judge-problem.mjs";
import { createJudgeIndexes, judgeRepository, rateLimitAll, serverProblem, RATE_WINDOWS, type ServerProblem } from "@/lib/db/judge-repository";
import { judgeService } from "@/lib/judge0/service";
import { encoded, type JudgeClient, type JudgeSubmission, type JudgePayload } from "@/lib/judge0/client";
import { errorResponse } from "@/lib/judge0/http";
import { JudgeError } from "@/lib/judge0/errors";
import { randomBytes } from "node:crypto";
import { credentialHttp } from "@/lib/accounts/credential-http";
import type { AuthConfig } from "@/lib/accounts/auth-config";
import { createCredentialUserIndexes } from "@/lib/db/credential-user-indexes";

vi.setConfig({ testTimeout: 30_000 });
const maximums = { max_cpu_time_limit: 2, max_wall_time_limit: 4, max_memory_limit: 64000, max_stack_limit: 32000, max_processes_and_or_threads: 15, max_max_file_size: 32, max_submission_batch_size: 20 };
let memory: MongoMemoryServer, connection: MongoClient;
beforeAll(async () => { memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); connection = await new MongoClient(memory.getUri()).connect(); }, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });
async function repo(name: string) { const db = connection.db(name); await createJudgeIndexes(db); return { db, repo: judgeRepository(db) }; }
const status = async (promise: Promise<unknown>) => promise.then(() => 200, (error: unknown) => (error as JudgeError).status);

describe("rate limit windows", () => {
  it("counts a minute budget and an hour budget for the same key separately", async () => {
    const { repo: limits } = await repo("windows"), start = Date.UTC(2030, 0, 1, 10, 0, 0);
    for (let i = 0; i < 3; i++) await limits.rateLimit("k", 3, start);
    expect(await status(limits.rateLimit("k", 3, start))).toBe(429);
    // A new minute resets the minute budget.
    expect(await status(limits.rateLimit("k", 3, start + 61_000))).toBe(200);
    // The hour budget keeps counting across those minutes.
    for (let i = 0; i < 5; i++) await limits.rateLimit("k", 5, start + i * 90_000, 1, RATE_WINDOWS.hour);
    expect(await status(limits.rateLimit("k", 5, start + 6 * 90_000, 1, RATE_WINDOWS.hour))).toBe(429);
    expect(await status(limits.rateLimit("k", 5, start + RATE_WINDOWS.hour + 1000, 1, RATE_WINDOWS.hour))).toBe(200);
  });
  it("charges a cost per call, so a budget can count test cases instead of requests", async () => {
    const { repo: limits } = await repo("cost");
    await limits.rateLimit("budget", 10, Date.now(), 8, RATE_WINDOWS.day);
    expect(await status(limits.rateLimit("budget", 10, Date.now(), 2, RATE_WINDOWS.day))).toBe(200);
    // Ten cases are used up, so even one more is refused (and refused attempts still count).
    expect(await status(limits.rateLimit("budget", 10, Date.now(), 1, RATE_WINDOWS.day))).toBe(429);
  });
  it("tells people how long to wait, with a message that matches the window", async () => {
    const { repo: limits } = await repo("messages"), now = Date.UTC(2030, 0, 1, 10, 0, 30);
    const fail = async (windowMs: number) => { await limits.rateLimit(`m${windowMs}`, 1, now, 1, windowMs); return limits.rateLimit(`m${windowMs}`, 1, now, 1, windowMs).then((): JudgeError => { throw new Error("The limit should have applied."); }, (error: JudgeError) => error); };
    const minute = await fail(RATE_WINDOWS.minute), hour = await fail(RATE_WINDOWS.hour), day = await fail(RATE_WINDOWS.day);
    expect([minute.status, hour.status, day.status]).toEqual([429, 429, 429]);
    expect(minute.retryAfterSeconds).toBe(30);
    expect(hour.retryAfterSeconds).toBe(3570);
    expect(day.retryAfterSeconds).toBe(DAY_REMAINING);
    expect(minute.message).toMatch(/wait a minute/i);
    expect(hour.message).toMatch(/hourly limit/i);
    expect(day.message).toMatch(/today/i);
    const response = errorResponse(hour);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3570");
    expect(errorResponse(new JudgeError(429, "x")).headers.get("Retry-After")).toBe("60");
  });
  it("expires counters through the TTL field so the collection stays small", async () => {
    const { db, repo: limits } = await repo("ttl"), now = Date.now();
    await limits.rateLimit("ttl-day", 5, now, 1, RATE_WINDOWS.day);
    const doc = await db.collection("judge_rate_limits").findOne({ _id: { $regex: "^ttl-day" } as never });
    expect(doc!.expiresAt.getTime()).toBe(now + 2 * RATE_WINDOWS.day);
  });
});
const DAY_REMAINING = Math.ceil(((Math.floor(Date.UTC(2030, 0, 1, 10, 0, 30) / 86_400_000) + 1) * 86_400_000 - Date.UTC(2030, 0, 1, 10, 0, 30)) / 1000);

describe("daily execution budget in the judge service", () => {
  function fakeClient(): JudgeClient {
    const entries = new Map<string, JudgeSubmission>();
    return {
      languages: vi.fn(async () => []), config: vi.fn(async () => maximums),
      submit: vi.fn(async (payloads: JudgePayload[]) => payloads.map(payload => { const token = crypto.randomUUID(); entries.set(token, { token, status_id: 3, stdout: payload.expected_output, time: "0.1", memory: 1 }); return token; })),
      read: vi.fn(async (tokens: string[]) => tokens.map(token => entries.get(token)!)),
    };
  }
  async function world(name: string) {
    const { db, repo: limits } = await repo(name);
    await db.collection<ServerProblem>("judge_problems").insertOne(serverProblem.parse(judgeDemoProblem()));
    return { db, limits, service: judgeService(limits, fakeClient()) };
  }
  const request = { problemId: "server-add-two-numbers", language: "python", code: "print(1)", mode: "submit" } as const;
  it("stops a signed-in person once their cases for the day are used, without blocking others", async () => {
    const { limits, service } = await world("budget-user");
    await limits.rateLimit("exec:user:heavy", 600, Date.now(), 598, RATE_WINDOWS.day);
    await expect(service.create(request, "ip-a", "heavy")).rejects.toMatchObject({ status: 429, message: expect.stringMatching(/today/i) });
    await expect(service.create(request, "ip-b", "light")).resolves.toHaveProperty("jobId");
  });
  it("gives guests an address budget, and lets a classroom of signed-in users share an address", async () => {
    const { limits, service } = await world("budget-ip");
    await limits.rateLimit("exec:ip:school", 1500, Date.now(), 1498, RATE_WINDOWS.day);
    await expect(service.create(request, "school", null)).rejects.toMatchObject({ status: 429 });
    await expect(service.create(request, "school", "student-1")).resolves.toHaveProperty("jobId");
  });
  it("limits how often a job can be canceled from one address", async () => {
    const { service } = await world("cancel");
    let blocked = 0;
    for (let i = 0; i < 65; i++) { try { await service.cancel("f".repeat(64), "noisy", null); } catch (error) { if ((error as JudgeError).status === 429) blocked++; } }
    expect(blocked).toBe(5);
    expect(encoded("x")).toBeTruthy();
  });
});

describe("account endpoints add hourly and page-load budgets", () => {
  const config: AuthConfig = { secret: randomBytes(32), origin: "https://iwons.test", allowedOrigins: ["https://iwons.test"], production: true, trustedIpHeader: "x-test-ip" };
  const hourStart = Math.floor(Date.now() / RATE_WINDOWS.hour) * RATE_WINDOWS.hour + RATE_WINDOWS.hour;
  const call = (path: string, body: unknown, ip = "192.0.2.77") => new Request(`https://iwons.test${path}`, { method: body === undefined ? "GET" : "POST",
    headers: { Origin: config.origin, "x-test-ip": ip, ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  async function http(name: string, at: { now: number }) {
    const db = connection.db(name); await createJudgeIndexes(db); await createCredentialUserIndexes(db);
    return credentialHttp({ database: async () => db, config: () => config, now: () => at.now });
  }
  it("blocks slow password guessing against one username after 30 tries in an hour", async () => {
    const at = { now: hourStart + 60_000 }, run = await http("login-hour", at);
    const statuses: number[] = []; let message = "";
    for (let attempt = 0; attempt < 31; attempt++) {
      at.now = hourStart + 60_000 + attempt * 70_000;
      const response = await run("login", call("/api/auth/login/", { username: "target_user", password: "wrong password" }, `192.0.2.${attempt % 200}`));
      statuses.push(response.status);
      if (response.status === 429) { message = ((await response.json()) as { error: string }).error; expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(60); }
    }
    expect(statuses.slice(0, 30).every(status => status === 401)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(message).toMatch(/hourly limit/i);
  }, 60_000);
  it("blocks mass signup from one address after 20 attempts in an hour", async () => {
    const at = { now: hourStart + 60_000 }, run = await http("signup-hour", at);
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 21; attempt++) {
      at.now = hourStart + 60_000 + attempt * 70_000;
      statuses.push((await run("signup", call("/api/auth/signup/", { username: `spam_${attempt}` }))).status);
    }
    expect(statuses.slice(0, 20).every(status => status === 400)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
  it("lets page loads through generously but not without limit", async () => {
    const at = { now: hourStart + 60_000 }, run = await http("me-limit", at);
    const statuses: number[] = [];
    for (let i = 0; i < 302; i++) statuses.push((await run("me", call("/api/auth/me/", undefined))).status);
    expect(statuses.slice(0, 300).every(status => status === 401)).toBe(true);
    expect(statuses.slice(300).every(status => status === 429)).toBe(true);
  });
});

describe("batched budgets and logging", () => {
  it("charges every budget in one go and refuses with the longest wait", async () => {
    const { repo: limits } = await repo("batch"), now = Date.UTC(2030, 0, 1, 10, 0, 30);
    await rateLimitAll(limits, [{ key: "b:a", limit: 1 }, { key: "b:b", limit: 5, windowMs: RATE_WINDOWS.hour }], now);
    const refused = await rateLimitAll(limits, [{ key: "b:a", limit: 1 }, { key: "b:b", limit: 1, windowMs: RATE_WINDOWS.hour }], now).catch((error: JudgeError) => error);
    expect(refused).toBeInstanceOf(JudgeError);
    expect((refused as JudgeError).status).toBe(429);
    // Both budgets were over the limit; the hour is the longer wait, so that is the one reported.
    expect((refused as JudgeError).retryAfterSeconds).toBe(3570);
    expect((refused as JudgeError).message).toMatch(/hourly/i);
    await expect(rateLimitAll(limits, [], now)).resolves.toBeUndefined();
  });
  it("reports a database failure as a failure, not as a rate limit", async () => {
    const broken = { rateLimit: async (key: string) => { if (key === "boom") throw new Error("connection lost"); throw new JudgeError(429, "limited", 5); } };
    await expect(rateLimitAll(broken, [{ key: "slow", limit: 1 }, { key: "boom", limit: 1 }])).rejects.toThrow("connection lost");
  });
  it("logs the first block of a bucket once, with the budget name and no identifier", async () => {
    const { repo: limits } = await repo("log"), now = Date.UTC(2030, 0, 1, 11, 0, 0), warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (let i = 0; i < 6; i++) await limits.rateLimit("auth:login:ip:SECRETHASH", 3, now).catch(() => {});
      expect(warn).toHaveBeenCalledTimes(1);
      const [message, details] = warn.mock.calls[0] as [string, { budget: string }];
      expect(message).toBe("[rate-limit] blocked");
      expect(details.budget).toBe("auth:login");
      expect(JSON.stringify(warn.mock.calls)).not.toContain("SECRETHASH");
    } finally { warn.mockRestore(); }
  });
});
