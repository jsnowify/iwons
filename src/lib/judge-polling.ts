import { z } from "zod";
import { jobResponse, cancelResponse, type JudgeRequest } from "./judge0/contracts";
import { storage } from "./storage";

/** Carries the HTTP status so the results panel can choose a friendly state. */
export class JudgeRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly retryAfterSeconds = 60) { super(message); }
}
export class JudgeCanceledError extends Error {}
async function responseJson(response: Response): Promise<unknown> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string().max(10_000) }).safeParse(body);
    const seconds = Number(response.headers.get("Retry-After"));
    throw new JudgeRequestError(error.success ? error.data.error : "The judge could not finish. Please try again.", response.status,
      Number.isFinite(seconds) && seconds > 0 ? Math.min(3600, seconds) : 60);
  }
  return body;
}
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { signal.removeEventListener("abort", abort); abort(); }
  });
}
export async function runServerJudge(input: JudgeRequest, onStatus: (message: string) => void, caller: AbortSignal,
  onProgress?: (done: number, total: number) => void, onCancellation?: (alreadyFinished: boolean | null) => void) {
  const signal = AbortSignal.any([caller, AbortSignal.timeout(60_000)]);
  const actor = storage.accountId();
  const headers: Record<string, string> = actor ? { "X-Iwons-Account": actor } : {};
  let jobId: string | undefined, cancellationSent = false;
  function cancel() {
    if (!jobId || cancellationSent) return;
    cancellationSent = true;
    void fetch(`/api/judge/${jobId}/cancel/`, { method: "POST", headers, credentials: "same-origin", cache: "no-store",
      keepalive: true, signal: AbortSignal.timeout(8000) }).then(responseJson).then(value => {
        onCancellation?.(cancelResponse.parse(value).alreadyFinished);
      }).catch(() => onCancellation?.(null));
  }
  signal.addEventListener("abort", cancel, { once: true });
  try {
  if (signal.aborted) throw new DOMException("Canceled", "AbortError");
  onStatus("Sending your code to the judge…");
  // Let creation return its job ID even if Stop is pressed meanwhile, so the
  // durable job can still be canceled rather than orphaned on an aborted POST.
  ({ jobId } = z.object({ jobId: z.string().regex(/^[a-f0-9]{64}$/) }).parse(await responseJson(await fetch("/api/judge/", {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(30_000), cache: "no-store",
  }))));
  if (signal.aborted) { cancel(); throw new DOMException("Canceled", "AbortError"); }
  let interval = 1000;
  while (!signal.aborted) {
    await wait(interval, signal);
    const result = jobResponse.parse(await responseJson(await fetch(`/api/judge/${jobId}/`, { signal, headers, cache: "no-store" })));
    if (result.state === "done") return { ...result.result, submissionId: jobId };
    if (result.state === "canceled") throw new JudgeCanceledError("This job was canceled. Your draft is saved.");
    onStatus(`Checking cases: ${result.done} of ${result.total} finished…`);
    onProgress?.(result.done, result.total);
    interval = Math.min(2500, interval * 1.15);
  }
  throw new Error("Judging took longer than a minute. Your draft is saved; try again shortly.");
  } catch (error) {
    if (signal.aborted && !caller.aborted) throw new Error("Judging took longer than a minute. Your draft is saved; try again shortly.");
    throw error;
  } finally { signal.removeEventListener("abort", cancel); }
}
