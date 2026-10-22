import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { judgeDemoProblem } from "../../scripts/curriculum/judge-problem.mjs";
import { judgeRepository, createJudgeIndexes, serverProblem, type JudgeJob, type ServerProblem } from "@/lib/db/judge-repository";
import { judgeService } from "@/lib/judge0/service";
import { judgeClient, encoded, decoded, type JudgeClient, type JudgeSubmission, type JudgePayload } from "@/lib/judge0/client";
import { judgeRequest } from "@/lib/judge0/contracts";
import { clampLimits } from "@/lib/judge0/limits";
import { normalizeOutput, grade } from "@/lib/judge0/results";
import { requesterHash, sameOrigin, jsonBody, errorResponse } from "@/lib/judge0/http";
import { resolveLanguage } from "@/lib/judge0/languages";

const maximums = { max_cpu_time_limit: 2, max_wall_time_limit: 4, max_memory_limit: 64000,
  max_stack_limit: 32000, max_processes_and_or_threads: 15, max_max_file_size: 32, max_submission_batch_size: 20 };
const body = { problemId: "server-add-two-numbers", language: "java", code: "public class Main {}", mode: "submit" } as const;
function fakeClient() {
  const entries = new Map<string, JudgeSubmission>();
  const client: JudgeClient = {
    languages: vi.fn(async () => [{ id: 999, name: "Java (OpenJDK 17.0.1)" }]),
    config: vi.fn(async () => maximums),
    submit: vi.fn(async (payloads: JudgePayload[]) => payloads.map(payload => {
      const token = crypto.randomUUID();
      entries.set(token, { token, status_id: 3, stdout: payload.expected_output, time: "0.1", memory: 4096 });
      return token;
    })),
    read: vi.fn(async (tokens: string[]) => tokens.map(token => entries.get(token)!)),
  };
  return { client, entries };
}
let memory: MongoMemoryServer;
let connection: MongoClient;
beforeAll(async () => {
  memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } });
  connection = await new MongoClient(memory.getUri()).connect();
}, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });

describe("Judge0 encoding, configuration, and errors", () => {
  it("round-trips Unicode and normalizes trailing whitespace without changing leading whitespace", () => {
    expect(decoded(encoded("ñ → 日本語\n"))).toBe("ñ → 日本語\n");
    expect(normalizeOutput(" 5 \t\r\n\r\n")).toBe(" 5");
    expect(normalizeOutput("5\n\n")).toBe("5");
  });
  it("rejects client tests, unknown languages, empty code, and oversized code", () => {
    for (const invalid of [{ ...body, language: "ruby" }, { ...body, code: " " },
      { ...body, code: "a".repeat(20001) }, { ...body, cases: [{ expected: "cheat" }] }])
      expect(judgeRequest.safeParse(invalid).success).toBe(false);
  });
  it("clamps Java headroom and disables network access", () => {
    expect(clampLimits("java", maximums)).toMatchObject({ cpu_time_limit: 2, memory_limit: 64000,
      stack_limit: 32000, max_processes_and_or_threads: 15, enable_network: false,
      enable_per_process_and_thread_memory_limit: false });
  });
  it("resolves server IDs by name and falls back with a warning", async () => {
    const repo = judgeRepository(connection.db("language-test"));
    expect(await resolveLanguage("java", fakeClient().client, repo)).toBe(999);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try { expect(await resolveLanguage("python", fakeClient().client, repo)).toBe(71); expect(warning).toHaveBeenCalled(); }
    finally { warning.mockRestore(); }
  });
  it("uses base64 batches and configurable RapidAPI headers, and maps busy responses", async () => {
    vi.stubEnv("JUDGE0_PROVIDER", "ce");
    vi.stubEnv("JUDGE0_URL", "https://judge.example/"); vi.stubEnv("JUDGE0_AUTH_TOKEN", "server-secret");
    vi.stubEnv("JUDGE0_RAPIDAPI_KEY", "rapid-secret"); vi.stubEnv("JUDGE0_RAPIDAPI_HOST", "judge.example");
    const mock = vi.fn().mockResolvedValue(new Response("{}", { status: 503 })); vi.stubGlobal("fetch", mock);
    try {
      await expect(judgeClient().submit([])).rejects.toThrow("busy");
      expect(String(mock.mock.calls[0][0])).toContain("base64_encoded=true");
      expect(String(mock.mock.calls[0][0])).not.toContain("wait=true");
      expect(mock.mock.calls[0][1].headers).toMatchObject({ "X-Auth-Token": "server-secret", "X-RapidAPI-Key": "rapid-secret" });
    } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
  });
  it("supports the free compatible host without sending its rejected network parameter", async () => {
    vi.stubEnv("JUDGE0_PROVIDER", "onlinecompiler");
    vi.stubEnv("JUDGE0_URL", "https://api.onlinecompiler.io/api/judge0");
    vi.stubEnv("JUDGE0_AUTH_TOKEN", "free-server-key");
    const mock = vi.fn().mockResolvedValue(Response.json([{ token: "private-token" }]));
    vi.stubGlobal("fetch", mock);
    try {
      const client = judgeClient();
      expect(client.maxCases).toBe(8);
      expect(client.accountRunsPerMinute).toBe(30);
      const tokens = await client.submit([{ source_code: encoded("print(5)"), stdin: encoded(""),
        expected_output: encoded("5"), language_id: 71, ...clampLimits("python", maximums) }]);
      expect(tokens).toEqual(["private-token"]);
      const [url, options] = mock.mock.calls[0];
      expect(String(url)).toBe("https://api.onlinecompiler.io/api/judge0/submissions/batch?base64_encoded=true");
      expect(JSON.parse(options.body).submissions[0]).not.toHaveProperty("enable_network");
      expect(options.headers["X-Auth-Token"]).toBe("free-server-key");
      vi.stubEnv("JUDGE0_URL", "https://untrusted.example/api/judge0");
      expect(() => judgeClient()).toThrow("not available");
    } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); }
  });
});

describe("durable guest judge jobs", () => {
  async function fixture(name: string) {
    const db = connection.db(name);
    await createJudgeIndexes(db);
    await db.collection<ServerProblem>("judge_problems").insertOne(serverProblem.parse(judgeDemoProblem()));
    const repo = judgeRepository(db);
    const fake = fakeClient();
    return { db, repo, ...fake, service: judgeService(repo, fake.client) };
  }
  it("runs only visible cases and submits all cases without returning hidden data", async () => {
    const { repo, service } = await fixture("guest-flow");
    const run = await service.create({ ...body, mode: "run" }, "guest");
    expect((await repo.job(run.jobId))?.tokens).toHaveLength(2);
    const submit = await service.create(body, "guest");
    const job = (await repo.job(submit.jobId))!;
    expect(job.tokens).toHaveLength(5);
    expect(job.expiresAt.getTime() - job.createdAt.getTime()).toBeLessThanOrEqual(3_600_001);
    const result = await service.poll(submit.jobId, "guest");
    expect(result.state).toBe("done");
    if (result.state !== "done") throw new Error("Expected done");
    expect(result.result).toMatchObject({ verdict: "accepted", passed: 5, total: 5 });
    expect(result.result.cases).toHaveLength(2);
    expect(result.result.hiddenCases).toEqual([1, 2, 3].map(index => ({ index, status: "passed" })));
    const runResult = await service.poll(run.jobId, "guest");
    expect(runResult).toMatchObject({ state: "done" });
    if (runResult.state === "done") expect(runResult.result).not.toHaveProperty("hiddenCases");
    const json = JSON.stringify(result);
    for (const secret of [...job.tokens, "private-zero", "private-large", "1999999", "expected", "stdin"])
      expect(json).not.toContain(secret);
  });
  it("returns only stable ordinal statuses for hidden failures, timeouts and errors", async () => {
    const { service, repo, entries } = await fixture("hidden-statuses");
    const { jobId } = await service.create(body, "guest"); const job = (await repo.job(jobId))!;
    for (const [index, status] of [[2, 4], [3, 5], [4, 11]]) Object.assign(entries.get(job.tokens[index])!,
      { status_id: status, stdout: encoded("private hidden actual"), stderr: encoded("private hidden stderr") });
    const result = await service.poll(jobId, "guest");
    if (result.state !== "done") throw new Error("Expected result");
    expect(result.result.hiddenCases).toEqual([{ index: 1, status: "failed" }, { index: 2, status: "timeout" }, { index: 3, status: "error" }]);
    const json = JSON.stringify(result);
    for (const secret of [...job.tokens, ...job.expected.slice(2), ...job.caseRefs.filter(item => item.hidden).map(item => item.id),
      "private hidden actual", "private hidden stderr"]) expect(json).not.toContain(secret);
    expect((await service.poll(jobId, "guest"))).toEqual(result);
  });
  it("authorizes before polling and rejects expired or unpublished problems", async () => {
    const { service, client, db } = await fixture("authorization");
    const { jobId } = await service.create(body, "owner");
    await expect(service.poll(jobId, "other")).rejects.toMatchObject({ status: 404 });
    expect(client.read).not.toHaveBeenCalled();
    await db.collection<JudgeJob>("judge_jobs").updateOne({ _id: jobId }, { $set: { expiresAt: new Date(0) } });
    await expect(service.poll(jobId, "owner")).rejects.toMatchObject({ status: 404 });
    await db.collection<ServerProblem>("judge_problems").updateOne({ _id: body.problemId }, { $set: { published: false } });
    await expect(service.create(body, "owner")).rejects.toMatchObject({ status: 404 });
  });
  it("reports pending progress, freezes grading data, and finalizes exactly once under concurrency", async () => {
    const { repo, service, entries, db } = await fixture("concurrent-finalization");
    const { jobId } = await service.create(body, "owner");
    const job = (await repo.job(jobId))!;
    const first = entries.get(job.tokens[0])!; first.status_id = 2;
    expect(await service.poll(jobId, "owner")).toEqual({ state: "running", done: 4, total: 5 });
    first.status_id = 3;
    await db.collection<ServerProblem>("judge_problems").updateOne({ _id: body.problemId }, { $set: { "cases.0.expected": "changed" } });
    const finalize = vi.spyOn(repo, "finalize");
    const outcomes = await Promise.all(Array.from({ length: 12 }, () => service.poll(jobId, "owner")));
    expect(new Set(outcomes.map(item => JSON.stringify(item))).size).toBe(1);
    expect((await Promise.all(finalize.mock.results.map(item => item.value))).filter(Boolean)).toHaveLength(1);
    expect((await repo.job(jobId))?.result?.verdict).toBe("accepted");
    expect(await service.poll(jobId, "owner")).toEqual(outcomes[0]);
  });
  it("enforces a shared database rate limit under concurrent requests", async () => {
    const { repo } = await fixture("limits");
    const outcomes = await Promise.allSettled(Array.from({ length: 20 }, () => repo.rateLimit("submit:guest", 5)));
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(5);
    expect(outcomes.filter(item => item.status === "rejected")).toHaveLength(15);
    const weighted = await Promise.allSettled(Array.from({ length: 10 }, () => repo.rateLimit("provider:free", 30, Date.now(), 5)));
    expect(weighted.filter(item => item.status === "fulfilled")).toHaveLength(6);
  });
  it("maps platform failures explicitly, logs details only on the server and refunds attempts once", async () => {
    const { repo, client, entries, db } = await fixture("platform-failure");
    const effects = vi.fn(); const service = judgeService(repo, client, effects);
    const { jobId } = await service.create(body, "ip", "account-owner");
    const job = (await repo.job(jobId))!;
    const values = job.tokens.map(token => entries.get(token)!);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const [status, stderr, details] of [[13, "", "private judge details"], [14, "format failure", ""],
        [11, "", ""], [11, "Could not reserve enough space", ""], [7, "Could not create the Java Virtual Machine", ""],
        [11, "isolate: sandbox initialization failed", ""]] as const) {
        values[0] = { ...values[0], status_id: status, stderr: encoded(stderr), message: encoded(details) };
        const result = grade(job, values);
        expect(result).toMatchObject({ verdict: "internal_error", failureSource: "platform" });
        expect(JSON.stringify(result)).not.toContain("private judge details");
      }
      for (const status of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        values[0] = { ...values[0], status_id: status, stdout: encoded("wrong"), stderr: encoded("user exception"), message: null };
        expect(grade(job, values).failureSource).toBe("user");
      }
      entries.get(job.tokens[0])!.status_id = 13;
      await Promise.all(Array.from({ length: 8 }, () => service.poll(jobId, "ip", "account-owner")));
      expect(effects).not.toHaveBeenCalled();
      for (const key of ["submit:ip", "submit:user:account-owner"])
        expect(await db.collection<{ _id: string; count: number; refunds: string[] }>("judge_rate_limits").findOne({ _id: `${key}:${Math.floor(job.attemptAt!.getTime() / 60_000)}` })).toMatchObject({ count: 0, refunds: [jobId] });
      expect(log).toHaveBeenCalledWith("[judge] Platform execution failure", expect.objectContaining({ jobId, status: 13, message: "private judge details" }));
    } finally { log.mockRestore(); }
  });
  it("authorizes account jobs across IP changes and leases finalization effects to one poller", async () => {
    const { repo, client } = await fixture("account-effects");
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const effects = vi.fn(async (job: JudgeJob) => {
      expect(job.finalizedAt).toBeInstanceOf(Date);
      await gate;
    });
    const service = judgeService(repo, client, effects);
    const { jobId } = await service.create(body, "original-ip", "account-owner");
    await expect(service.poll(jobId, "original-ip", "other-account")).rejects.toMatchObject({ status: 404 });
    await expect(service.poll(jobId, "original-ip")).rejects.toMatchObject({ status: 404 });
    const polls = Array.from({ length: 8 }, () => service.poll(jobId, "new-ip", "account-owner"));
    await vi.waitFor(() => expect(effects).toHaveBeenCalledTimes(1));
    release();
    await Promise.all(polls);
    expect(await service.poll(jobId, "another-ip", "account-owner")).toMatchObject({ state: "done" });
    expect(effects).toHaveBeenCalledTimes(1);
    expect((await repo.job(jobId))?.effectsDone).toBe(true);
  });
  it("cancels atomically before a late result, enforces ownership and tolerates repeated cancellation", async () => {
    const { db, repo, client } = await fixture("cancel-wins");
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const read = client.read;
    const started = vi.fn();
    client.read = vi.fn(async tokens => { started(); await gate; return read(tokens); });
    const effects = vi.fn(async () => { await db.collection("submissions").insertOne({ marker: true }); await db.collection("solves").insertOne({ marker: true }); });
    const service = judgeService(repo, client, effects);
    const { jobId } = await service.create(body, "ip", "owner");
    await expect(service.cancel(jobId, "ip", "other")).rejects.toMatchObject({ status: 404 });
    const pending = service.poll(jobId, "new-ip", "owner");
    await vi.waitFor(() => expect(started).toHaveBeenCalled());
    expect(await service.cancel(jobId, "new-ip", "owner")).toEqual({ state: "canceled", alreadyFinished: false });
    expect(await service.cancel(jobId, "new-ip", "owner")).toEqual({ state: "canceled", alreadyFinished: false });
    release(); expect(await pending).toEqual({ state: "canceled" });
    expect(await service.poll(jobId, "ip", "owner")).toEqual({ state: "canceled" });
    expect(await repo.finalize(jobId, grade((await repo.job(jobId))!, await read((await repo.job(jobId))!.tokens)))).toBe(false);
    expect(effects).not.toHaveBeenCalled();
    expect(await db.collection("submissions").countDocuments({})).toBe(0);
    expect(await db.collection("solves").countDocuments({})).toBe(0);
    const guest = await service.create(body, "guest-ip");
    await expect(service.cancel(guest.jobId, "other-ip")).rejects.toMatchObject({ status: 404 });
    expect(await service.cancel(guest.jobId, "guest-ip")).toMatchObject({ state: "canceled" });
  });
  it("keeps finalized results when cancellation loses the race", async () => {
    const { repo, client } = await fixture("finalize-wins"); const effects = vi.fn();
    const service = judgeService(repo, client, effects);
    const { jobId } = await service.create(body, "ip", "owner");
    const result = await service.poll(jobId, "ip", "owner");
    expect(result.state).toBe("done");
    expect(await service.cancel(jobId, "ip", "owner")).toEqual({ ...result, alreadyFinished: true });
    expect(effects).toHaveBeenCalledTimes(1);
    expect((await repo.job(jobId))?.canceledAt).toBeNull();
  });
  it("retries interrupted account effects without re-running the upstream judge", async () => {
    const { repo, client } = await fixture("account-effects-recovery");
    const effects = vi.fn().mockRejectedValueOnce(new Error("interrupted write")).mockResolvedValue(undefined);
    const service = judgeService(repo, client, effects);
    const { jobId } = await service.create(body, "ip", "account-owner");
    await expect(service.poll(jobId, "ip", "account-owner")).rejects.toThrow("interrupted write");
    expect((await repo.job(jobId))?.effectsLease).toBeUndefined();
    expect(await service.poll(jobId, "ip", "account-owner")).toMatchObject({ state: "done" });
    expect(client.read).toHaveBeenCalledTimes(1);
    expect(effects).toHaveBeenCalledTimes(2);
    expect(await service.poll(jobId, "ip", "account-owner")).toMatchObject({ state: "done" });
    expect(effects).toHaveBeenCalledTimes(2);
  });
  it("rejects oversized free-host jobs before creating upstream work", async () => {
    const { db, client, repo } = await fixture("free-host-cap");
    client.maxCases = 8;
    await db.collection<ServerProblem>("judge_problems").updateOne({ _id: body.problemId }, { $set: {
      cases: Array.from({ length: 9 }, (_, i) => ({ id: `case-${i}`, stdin: "1 1", expected: "2", hidden: true })),
    } });
    await expect(judgeService(repo, client).create(body, "guest")).rejects.toMatchObject({ status: 400 });
    expect(client.submit).not.toHaveBeenCalled();
  });
  it("chunks batches into at most twenty cases", async () => {
    const { db, client, service } = await fixture("chunks");
    await db.collection<ServerProblem>("judge_problems").updateOne({ _id: body.problemId }, { $set: {
      cases: Array.from({ length: 45 }, (_, i) => ({ id: `case-${i}`, stdin: "1 1", expected: "2", hidden: false })),
    } });
    await service.create(body, "guest");
    expect(vi.mocked(client.submit).mock.calls.map(([items]) => items.length)).toEqual([20, 20, 5]);
  });
  it("masks hidden runtime output and maps status/error variants", async () => {
    const { repo, service, entries } = await fixture("mapping");
    const { jobId } = await service.create(body, "guest");
    const job: JudgeJob = (await repo.job(jobId))!;
    const values = job.tokens.map(token => entries.get(token)!);
    values[2].status_id = 11; values[2].stderr = encoded("secret hidden input 777");
    expect(grade(job, values).message).not.toContain("777");
    for (const [status, verdict, output] of [[4, "wrong_answer", ""], [5, "time_limit", ""],
      [6, "compile_error", "Main.java:3: compilation failed"], [11, "internal_error", ""], [13, "internal_error", ""]] as const) {
      values[0] = { ...values[0], status_id: status, stdout: encoded("wrong"), compile_output: encoded(output) };
      const result = grade(job, values);
      expect(result.verdict).toBe(verdict);
      if (status === 6) expect(result.message).toBe(output);
    }
    values[0] = { ...values[0], status_id: 4, stdout: encoded("5   \r\n\n") };
    values[2].status_id = 3;
    expect(grade(job, values).verdict).toBe("accepted");
  });
});

describe("HTTP boundaries", () => {
  it("rejects cross-origin creation and limits actual streamed body bytes", async () => {
    expect(() => sameOrigin(new Request("http://localhost:4174/api/judge", {
      headers: { host: "127.0.0.1:4174", origin: "http://127.0.0.1:4174" },
    }))).not.toThrow();
    expect(() => sameOrigin(new Request("https://iwons.example/api/judge", { headers: { origin: "https://evil.example" } }))).toThrow();
    await expect(jsonBody(new Request("https://iwons.example", { method: "POST", body: "x".repeat(100001) }))).rejects.toMatchObject({ status: 413 });
    expect(await errorResponse(new Error("secret-uri")).json()).not.toHaveProperty("stack");
  });
  it("ignores spoofed forwarded headers outside a configured trusted proxy", () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(32)); vi.stubEnv("VERCEL", ""); vi.stubEnv("TRUSTED_IP_HEADER", "");
    try {
      const request = (ip: string) => new Request("http://localhost", { headers: { "x-forwarded-for": ip } });
      expect(requesterHash(request("1.2.3.4"))).toBe(requesterHash(request("5.6.7.8")));
      vi.stubEnv("TRUSTED_IP_HEADER", "x-forwarded-for");
      expect(requesterHash(request("1.2.3.4"))).not.toBe(requesterHash(request("5.6.7.8")));
    } finally { vi.unstubAllEnvs(); }
  });
});
