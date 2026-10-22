import "server-only";
import type { JudgeJob } from "../db/judge-repository";
import { decoded, type JudgeSubmission } from "./client";
import type { PublicJudgeResult } from "./contracts";

export const normalizeOutput = (text: string) => text.replace(/\r\n?/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").replace(/\n+$/, "");
const truncate = (text: string) => text.slice(0, 10_000);
const runtimeMs = (value: JudgeSubmission) => {
  const number = Number(value.time ?? 0) * 1000;
  return Number.isFinite(number) && number >= 0 ? number : 0;
};
function message(value: JudgeSubmission, hidden: boolean): string {
  const stderr = decoded(value.stderr);
  if (value.status_id === 6) return truncate(decoded(value.compile_output) || "Your code could not compile.");
  if (value.status_id === 5) return "Your solution took too long. Try a more efficient approach.";
  if (value.status_id >= 7) return hidden ? "Your program stopped on a hidden case. Check array bounds and input handling."
    : truncate(`${stderr || "Your program stopped unexpectedly."}\nCheck array bounds and input handling.`);
  return hidden ? "A hidden case did not pass. Try edge cases and check the problem requirements." : "The output did not match. Check the visible example.";
}
export function isPlatformFailure(value: JudgeSubmission) {
  const stderr = decoded(value.stderr);
  const details = `${stderr}\n${decoded(value.message)}`;
  return value.status_id === 13 || value.status_id === 14 ||
    (value.status_id >= 7 && /Could not reserve enough space|Could not create the Java Virtual Machine|insufficient memory|sandbox.*(?:fail|error)|isolate:.*(?:fail|error)/i.test(details)) ||
    (value.status_id === 11 && !stderr.trim());
}
export function grade(job: JudgeJob, submissions: JudgeSubmission[]): PublicJudgeResult {
  if (submissions.length !== job.caseRefs.length || submissions.some(item => item.status_id < 3)) throw new Error("Incomplete judge batch");
  const cases = submissions.map((item, index) => {
    const stdout = decoded(item.stdout);
    return { item, ref: job.caseRefs[index], stdout,
      passed: [3, 4].includes(item.status_id) && normalizeOutput(stdout) === normalizeOutput(job.expected[index]) };
  });
  const platformFailures = cases.filter(({ item }) => isPlatformFailure(item));
  for (const { item } of platformFailures) console.error("[judge] Platform execution failure", {
    jobId: job._id, status: item.status_id, message: decoded(item.message),
    stderr: decoded(item.stderr), compileOutput: decoded(item.compile_output),
  });
  const platform = platformFailures[0];
  const failed = platform ?? cases.find(item => !item.passed);
  const status = failed?.item.status_id ?? 3;
  const verdict = platform ? "internal_error" : !failed ? "accepted" : status === 6 ? "compile_error" : status === 5 ? "time_limit"
    : status >= 7 ? "runtime_error" : "wrong_answer";
  return {
    verdict, failureSource: platform ? "platform" : "user", passed: cases.filter(item => item.passed).length, total: cases.length,
    runtimeMs: submissions.reduce((sum, item) => sum + runtimeMs(item), 0),
    memoryKb: Math.max(0, ...submissions.map(item => Math.max(0, item.memory ?? 0))),
    message: platform ? "Execution failed on our side. Your draft is saved; please try again." : failed ? message(failed.item, failed.ref.hidden) : "All test cases passed.",
    ...(job.mode === "submit" ? { hiddenCases: cases.filter(({ ref }) => ref.hidden).map(({ item, passed }, index) => ({
      index: index + 1, status: passed ? "passed" as const : item.status_id === 5 ? "timeout" as const
        : item.status_id >= 6 ? "error" as const : "failed" as const,
    })) } : {}),
    cases: cases.filter(item => !item.ref.hidden).map(({ item, ref, passed, stdout }) => ({
      id: ref.id, passed, stdout: truncate(stdout), runtimeMs: runtimeMs(item),
      ...(!passed ? { error: isPlatformFailure(item) ? "Execution failed on our side. Please retry." : message(item, false) } : {}),
    })),
  };
}
