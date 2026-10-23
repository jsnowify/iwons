import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { memoryRateLimit, memoryRateLimitSize, resetMemoryRateLimit } from "@/lib/ratelimit/memory";
import { JudgeError } from "@/lib/judge0/errors";
import { errorResponse } from "@/lib/judge0/http";
import { createRoomIndexes } from "@/lib/db/rooms";
import { createJudgeIndexes } from "@/lib/db/judge-repository";

vi.setConfig({ testTimeout: 30_000 });
const state = vi.hoisted(() => ({ db: null as unknown as Db }));
vi.mock("@/lib/db/client", () => ({ database: async () => state.db }));
vi.mock("@/lib/accounts/http", () => ({
  requireUser: async () => ({ _id: "user-reader", username: "reader", displayName: "Reader", name: "Reader" }),
  requestUser: async () => ({ _id: "user-reader", username: "reader", displayName: "Reader", name: "Reader" }),
}));
const { myRoomsEndpoint, catalogEndpoint, getRoomEndpoint, membersEndpoint, meEndpoint, leaderboardEndpoint, problemDetailEndpoint, listCustomEndpoint, createRoomEndpoint } = await import("@/lib/rooms/endpoints");

let memory: MongoMemoryServer, connection: MongoClient;
beforeAll(async () => {
  process.env.AUTH_SECRET = "x".repeat(40); process.env.TRUSTED_IP_HEADER = "x-test-ip";
  memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } }); connection = await new MongoClient(memory.getUri()).connect();
}, 180_000);
afterAll(async () => { await connection?.close(); await memory?.stop(); });
beforeEach(() => resetMemoryRateLimit());

describe("memory limiter", () => {
  const status = (action: () => void) => { try { action(); return 200; } catch (error) { return (error as JudgeError).status; } };
  it("refuses after the configured count and allows again when the window resets", () => {
    const start = Date.UTC(2030, 0, 1, 10, 0, 10);
    for (let i = 0; i < 3; i++) expect(status(() => memoryRateLimit("k", 3, start))).toBe(200);
    expect(status(() => memoryRateLimit("k", 3, start))).toBe(429);
    expect(status(() => memoryRateLimit("k", 3, start + 49_000))).toBe(429);
    expect(status(() => memoryRateLimit("k", 3, start + 50_000))).toBe(200);
  });
  it("answers exactly like the database limiter: status, message and Retry-After", () => {
    const now = Date.UTC(2030, 0, 1, 10, 0, 30);
    memoryRateLimit("k", 1, now);
    const error = (() => { try { memoryRateLimit("k", 1, now); } catch (thrown) { return thrown as JudgeError; } throw new Error("expected a limit"); })();
    expect(error).toBeInstanceOf(JudgeError);
    expect([error.status, error.retryAfterSeconds]).toEqual([429, 30]);
    expect(error.message).toBe("Too many requests. Please wait a minute and try again.");
    const response = errorResponse(error);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });
  it("keeps keys separate", () => {
    memoryRateLimit("a", 1, 1000);
    expect(status(() => memoryRateLimit("b", 1, 1000))).toBe(200);
    expect(status(() => memoryRateLimit("a", 1, 1000))).toBe(429);
  });
  it("drops expired keys, and never holds more than 10,000 keys", () => {
    for (let i = 0; i < 500; i++) memoryRateLimit(`old:${i}`, 5, 1_000);
    expect(memoryRateLimitSize()).toBe(500);
    memoryRateLimit("fresh", 5, 200_000);
    expect(memoryRateLimitSize()).toBe(1);
    const now = 400_000;
    for (let i = 0; i < 12_000; i++) memoryRateLimit(`flood:${i}`, 5, now);
    expect(memoryRateLimitSize()).toBeLessThanOrEqual(10_000);
  });
});

describe("read routes make no database limiter write", () => {
  const request = (path: string, method = "GET", headers: Record<string, string> = {}) => new Request(`http://localhost${path}`, { method, headers: { "x-test-ip": "192.0.2.5", ...headers } });
  const context = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) });
  const limiterDocs = () => state.db.collection("judge_rate_limits").countDocuments();
  async function fresh(name: string) { state.db = connection.db(name); await createJudgeIndexes(state.db); await createRoomIndexes(state.db); }
  const reads: [string, (r: Request, c: ReturnType<typeof context>) => Promise<Response>, string, Record<string, string>][] = [
    ["rooms/mine", myRoomsEndpoint, "/api/rooms/mine/", {}],
    ["rooms/catalog", catalogEndpoint, "/api/rooms/catalog/?q=&limit=3", {}],
    ["rooms/:code", getRoomEndpoint, "/api/rooms/ABCD2345/", { code: "ABCD2345" }],
    ["rooms/:code/members", membersEndpoint, "/api/rooms/ABCD2345/members/", { code: "ABCD2345" }],
    ["rooms/:code/me", meEndpoint, "/api/rooms/ABCD2345/me/", { code: "ABCD2345" }],
    ["rooms/:code/leaderboard", leaderboardEndpoint, "/api/rooms/ABCD2345/leaderboard/?limit=10", { code: "ABCD2345" }],
    ["rooms/:code/problems/:p", problemDetailEndpoint, "/api/rooms/ABCD2345/problems/c-x/", { code: "ABCD2345", refKey: "c-x" }],
    ["rooms/:code/custom-problems", listCustomEndpoint, "/api/rooms/ABCD2345/custom-problems/", { code: "ABCD2345" }],
  ];
  it.each(reads)("%s does not write to judge_rate_limits", async (_name, handler, path, params) => {
    await fresh(`reads-${_name.replace(/\W/g, "")}`);
    const response = await handler(request(path), context(params));
    // A missing room is a 404, which still passes through the limiter code path; what matters is that nothing was written.
    expect([200, 404, 403]).toContain(response.status);
    expect(await limiterDocs()).toBe(0);
  });
  it("the catalog still answers 429 with Retry-After after 30 requests in a window", async () => {
    await fresh("catalog-429");
    const statuses: number[] = [];
    let last!: Response;
    for (let i = 0; i < 31; i++) { last = await catalogEndpoint(request("/api/rooms/catalog/?q=&limit=1"), context()); statuses.push(last.status); }
    expect(statuses.slice(0, 30).every(code => code === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(Number(last.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(await limiterDocs()).toBe(0);
  });
  it("writes still use the shared database limiter", async () => {
    await fresh("write-limiter");
    const response = await createRoomEndpoint(new Request("http://localhost/api/rooms/", { method: "POST", headers: { Origin: "http://localhost", Host: "localhost", "x-test-ip": "192.0.2.5", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Limiter room" }) }), context());
    expect(response.status).toBe(201);
    const ids = (await state.db.collection("judge_rate_limits").find().toArray()).map(item => String(item._id));
    expect(ids.some(id => id.startsWith("rooms:write:user-reader:"))).toBe(true);
    expect(ids.some(id => id.startsWith("rooms:create:user-reader:"))).toBe(true);
  });
});
