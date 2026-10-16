import type { Language, RunRequest, RunResult, Settings } from "@/lib/types";
import { compare } from "@/lib/harness/compare";
export function runCode(
  language: Language,
  req: RunRequest,
  settings: Settings,
  onStatus: (s: string) => void,
  signal?: AbortSignal,
): Promise<RunResult> {
  if (req.mode === "program" && language !== "java")
    return Promise.resolve({
      verdict: "compile_error",
      cases: [],
      compileError: { message: "Whole-program mode currently requires Java." },
    });
  if (language === "java" && settings.javaBackend === "cheerpj")
    return Promise.resolve({
      verdict: "compile_error",
      cases: [],
      compileError: {
        message:
          "The CheerpJ backend is not available: browser compilation needs a bundled compiler and a compatible license. Choose your self-hosted Judge0 CE endpoint in Settings.",
      },
    });
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout>;
    let settled = false;
    const worker =
      language === "python"
        ? new Worker("/runners/py.worker.js", { type: "module" })
        : language === "java"
          ? new Worker("/runners/java.worker.js")
          : new Worker(new URL("./js.worker.ts", import.meta.url));
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      resolve(result);
    };
    const abort = () =>
      finish({
        verdict: "runtime_error",
        cases: [],
        compileError: { message: "Execution cancelled." },
      });
    const timeout = () =>
      finish({
        verdict: "time_limit",
        cases: [],
        compileError: {
          message: `Execution exceeded ${req.timeLimitMs} ms. The worker was terminated.`,
        },
      });
    timer = setTimeout(
      timeout,
      language === "python"
        ? 90000
        : language === "java"
          ? 60000
          : req.timeLimitMs,
    );
    if (language === "python")
      onStatus("Loading Python runtime… first run needs a download");
    else
      onStatus(
        language === "java"
          ? "Sending to your Judge0 endpoint…"
          : "Running test cases…",
      );
    worker.onmessage = (e) => {
      if (e.data.status === "ready") {
        clearTimeout(timer);
        timer = setTimeout(timeout, req.timeLimitMs);
        onStatus("Running test cases…");
        return;
      }
      const result = e.data as RunResult;
      if (language === "python" || language === "java") {
        for (const c of result.cases)
          c.passed = !c.error && compare(c.actual, c.expected, req.comparison);
        if (result.verdict === "accepted" || result.verdict === "wrong_answer")
          result.verdict = result.cases.every((c) => c.passed)
            ? "accepted"
            : "wrong_answer";
      }
      finish(result);
    };
    worker.onerror = (e) =>
      finish({
        verdict: "runtime_error",
        cases: [],
        compileError: {
          message:
            e.message ||
            "The runtime could not start. Check your network and retry.",
        },
      });
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    worker.postMessage({ ...req, language, judgeUrl: settings.judgeUrl });
  });
}
