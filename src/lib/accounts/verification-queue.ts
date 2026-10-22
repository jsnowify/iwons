import { JudgeRequestError } from "../judge-polling";
import type { PublicJudgeResult } from "../judge0/contracts";
import type { VerificationCandidate, VerificationStatus } from "./verification-contracts";

export function queueDelay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException("Paused", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { signal.removeEventListener("abort", abort); abort(); }
  });
}
export class SubmitBudget {
  constructor(public starts: number[], public blockedUntil: number,
    private save: (starts: number[], blockedUntil: number) => void,
    private now = Date.now, private delay = queueDelay) {}
  async reserve(signal: AbortSignal, onWaiting: () => void) {
    while (!signal.aborted) {
      const now = this.now();
      this.starts = this.starts.filter(at => at > now - 60_000);
      const until = Math.max(this.blockedUntil, this.starts.length >= 5 ? this.starts[0] + 60_001 : 0);
      if (until <= now) {
        this.starts.push(now); this.save([...this.starts], this.blockedUntil); return;
      }
      onWaiting(); await this.delay(until - now, signal);
    }
    throw new DOMException("Paused", "AbortError");
  }
  defer(seconds: number) {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + seconds * 1000 + 1);
    this.save([...this.starts], this.blockedUntil);
  }
}
export async function runVerificationQueue(items: VerificationCandidate[], options: {
  signal: AbortSignal; concurrency: number; budget: SubmitBudget;
  run: (item: VerificationCandidate, signal: AbortSignal) => Promise<PublicJudgeResult>;
  onItem: (item: VerificationCandidate, status: VerificationStatus) => void;
  onWaiting: () => void;
}) {
  const stop = new AbortController(), signal = AbortSignal.any([options.signal, stop.signal]);
  let next = 0, unavailable = false;
  async function worker() {
    while (!signal.aborted && next < items.length) {
      const item = items[next++];
      while (!signal.aborted) {
        try {
          await options.budget.reserve(signal, options.onWaiting);
          if (signal.aborted) return;
          options.onItem(item, "running");
          const result = await options.run(item, signal);
          if (result.failureSource === "platform") {
            options.onItem(item, "pending"); unavailable = true; stop.abort(); return;
          }
          options.onItem(item, result.verdict === "accepted" ? "accepted" : "needs_update");
          break;
        } catch (error) {
          options.onItem(item, "pending");
          if (signal.aborted) return;
          if (error instanceof JudgeRequestError && error.status === 429) {
            options.budget.defer(error.retryAfterSeconds); continue;
          }
          unavailable = true; stop.abort(); return;
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(3, options.concurrency)) }, worker));
  return { paused: signal.aborted, unavailable };
}
