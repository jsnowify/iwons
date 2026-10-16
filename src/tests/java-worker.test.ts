import { expect, it } from "vitest";
import { Worker } from "node:worker_threads";
import { readFileSync } from "node:fs";
import type { RunRequest, RunResult } from "@/lib/types";

interface SubmissionBody {
  source_code: string;
  stdin: string;
  compiler_options?: string;
  enable_network?: boolean;
}
function run(request: Partial<RunRequest>, outputs: object[]) {
  return new Promise<{ result: RunResult; submissions: SubmissionBody[] }>((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const submissions = [];
      globalThis.self = { postMessage: result => parentPort.postMessage({result, submissions}) };
      globalThis.fetch = async (url, options) => {
        if (url.endsWith('/languages')) return {ok:true,json:async()=>[{id:62,name:'Java (OpenJDK 13.0.1)'}]};
        if (url === '/runners/JavaHarness.txt') return {ok:true,text:async()=>workerData.template};
        if (options?.method === 'POST') {
          submissions.push(JSON.parse(options.body));
          return {ok:true,json:async()=>({token:String(submissions.length-1)})};
        }
        const index = Number(new URL(url).pathname.split('/').pop());
        return {ok:true,json:async()=>workerData.outputs[index]};
      };
      require('node:vm').runInThisContext(workerData.source);
      self.onmessage({data:workerData.request});
    `, {
      eval: true,
      workerData: {
        source: readFileSync("public/runners/java.worker.js", "utf8"),
        template: readFileSync("public/runners/JavaHarness.txt", "utf8"),
        request: { code: "public class Main {}", mode: "program", functionName: "main", timeLimitMs: 2000, judgeUrl: "https://judge.invalid", ...request },
        outputs,
      },
    });
    const timer = setTimeout(() => { void worker.terminate(); reject(new Error("Worker fixture exceeded its deadline")); }, 5000);
    worker.once("message", result => { clearTimeout(timer); void worker.terminate(); resolve(result); });
    worker.once("error", error => { clearTimeout(timer); void worker.terminate(); reject(error); });
  });
}

it("passes complete Java source and per-case stdin, enforcing Java 8 and stdout whitespace rules", async () => {
  const code = "public class Main {}\nclass Receipt {}";
  const { result, submissions } = await run({ code, stdin: "fallback", cases: [
    { id: "a", input: [], stdin: "7\n", expected: "14\n" },
    { id: "b", input: ["3\n"], expected: "6" },
  ] }, [
    { status: { id: 3 }, stdout: "14 \t\r\n\r\n", time: "0.02" },
    { status: { id: 3 }, stdout: "6\n", time: "0.01" },
  ]);
  expect(result.verdict).toBe("accepted");
  expect(result.cases[0].stdout).toBe("14 \t\r\n\r\n");
  expect(submissions.map(submission => submission.stdin)).toEqual(["7\n", "fallback"]);
  for (const submission of submissions) {
    expect(submission.source_code).toBe(code);
    expect(submission.compiler_options).toBe("--release 8");
    expect(submission.enable_network).toBe(false);
  }
  const perCase = await run({ cases: [{ id: "a", input: ["3\n"], expected: "6" }] }, [
    { status: { id: 3 }, stdout: "6\n" },
  ]);
  expect(perCase.submissions[0].stdin).toBe("3\n");
});

it("preserves meaningful leading whitespace and interior blank lines", async () => {
  const { result } = await run({ cases: [{ id: "a", input: [""], expected: "a\nb" }] }, [
    { status: { id: 3 }, stdout: " a\n\nb\n" },
  ]);
  expect(result.verdict).toBe("wrong_answer");
  expect(result.cases[0].actual).toBe(" a\n\nb");
});

it("keeps function and operations requests on the existing JSON harness", async () => {
  for (const mode of ["function", "operations"] as const) {
    const cases = [{ id: "a", input: [], expected: 4 }];
    const response = { verdict: "accepted", cases: [{ id: "a", expected: 4, actual: 4, passed: true }] };
    const { result, submissions } = await run({ mode, code: "public class Solution {}", cases }, [
      { status: { id: 3 }, stdout: JSON.stringify(response) },
    ]);
    expect(result).toEqual(response);
    expect(JSON.parse(submissions[0].stdin).mode).toBe(mode);
    expect(submissions[0].source_code).toContain("public class Main");
    expect(submissions[0].source_code).toContain("class Solution {}");
    expect(submissions[0].compiler_options).toBeUndefined();
  }
});

it("reports compiler errors and runtime time limits without inventing passing cases", async () => {
  for (const [id, verdict] of [[6, "compile_error"], [5, "time_limit"]] as const) {
    const { result } = await run({ cases: [{ id: "a", input: [], expected: "" }] }, [
      { status: { id }, compile_output: "Main.java: missing brace" },
    ]);
    expect(result.verdict).toBe(verdict);
    expect(result.cases).toEqual([]);
    if (id === 6) expect(result.compileError?.message).toContain("missing brace");
  }
});
