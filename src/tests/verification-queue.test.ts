import { describe, expect, it, vi } from "vitest";
import { SubmitBudget, runVerificationQueue } from "@/lib/accounts/verification-queue";
import { publicResult } from "@/lib/judge0/contracts";
import { JudgeRequestError } from "@/lib/judge-polling";
import type { VerificationCandidate, VerificationStatus } from "@/lib/accounts/verification-contracts";
const accepted = publicResult.parse({ verdict: "accepted", failureSource: "user", passed: 5, total: 5,
  runtimeMs: 10, memoryKb: 10, message: "Passed", cases: [] });
const items = (count: number): VerificationCandidate[] => Array.from({ length: count }, (_, index) => ({
  problemId: `problem-${index}`, title: `Problem ${index}`, reason: "ready", language: "java", code: "public class Main {}",
}));
function clock() {
  let now = 1000; const delays: number[] = [];
  return { now: () => now, delays, delay: async (ms: number) => { delays.push(ms); now += ms; } };
}
describe("client-orchestrated imported verification", () => {
  it("uses at most three workers and reserves at most five starts in any minute", async () => {
    const time = clock(), starts: number[] = []; let active = 0, maximum = 0;
    const onItem = vi.fn();
    const result = await runVerificationQueue(items(8), { signal: new AbortController().signal, concurrency: 3,
      budget: new SubmitBudget([], 0, () => {}, time.now, time.delay), onItem, onWaiting: vi.fn(),
      run: async () => { starts.push(time.now()); active++; maximum = Math.max(maximum, active);
        await new Promise(resolve => setTimeout(resolve, 1)); active--; return accepted; },
    });
    expect(maximum).toBe(3); expect(result.paused).toBe(false);
    expect(onItem.mock.calls.filter(([, status]) => status === "accepted")).toHaveLength(8);
    for (const at of starts) expect(starts.filter(value => value >= at && value < at + 60_000).length).toBeLessThanOrEqual(5);
    expect(time.delays.some(ms => ms >= 60_000)).toBe(true);
  });
  it("waits for Retry-After and retries the same solve after a rate limit", async () => {
    const time = clock(), onItem = vi.fn();
    const run = vi.fn().mockRejectedValueOnce(new JudgeRequestError("Wait", 429, 2)).mockResolvedValue(accepted);
    await runVerificationQueue(items(1), { signal: new AbortController().signal, concurrency: 3,
      budget: new SubmitBudget([], 0, () => {}, time.now, time.delay), run, onItem, onWaiting: vi.fn() });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0][0]).toEqual(run.mock.calls[1][0]);
    expect(time.delays).toEqual([2001]);
    expect(onItem.mock.calls.map(([, status]) => status)).toEqual(["running", "pending", "running", "accepted"]);
  });
  it("keeps interrupted work pending for resume and pauses platform failures without blaming code", async () => {
    const time = clock(), controller = new AbortController(), states = new Map<string, VerificationStatus>();
    const tasks = items(3); let active = 0;
    const budget = new SubmitBudget([], 0, () => {}, time.now, time.delay);
    const onItem = (item: VerificationCandidate, status: VerificationStatus) => { states.set(item.problemId, status); };
    const paused = await runVerificationQueue(tasks, { signal: controller.signal, concurrency: 3, budget, onItem, onWaiting: vi.fn(),
      run: async (_item, signal) => {
        active++; if (active === 2) controller.abort();
        if (signal.aborted) throw new DOMException("Paused", "AbortError");
        return new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("Paused", "AbortError")), { once: true }));
      },
    });
    expect(paused.paused).toBe(true);
    expect([...states.values()]).not.toContain("needs_update");
    const resumed = await runVerificationQueue(tasks, { signal: new AbortController().signal, concurrency: 3, budget, onItem,
      onWaiting: vi.fn(), run: async () => accepted });
    expect(resumed.paused).toBe(false); expect([...states.values()]).toEqual(["accepted", "accepted", "accepted"]);
    const platform = await runVerificationQueue(items(1), { signal: new AbortController().signal, concurrency: 1,
      budget, onItem, onWaiting: vi.fn(), run: async () => ({ ...accepted, verdict: "internal_error", failureSource: "platform" }) });
    expect(platform).toEqual({ paused: true, unavailable: true });
    expect(states.get("problem-0")).toBe("pending");
  });
});
