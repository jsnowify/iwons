import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Worker } from "node:worker_threads";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { transform } from "sucrase";
import { compare } from "@/lib/harness/compare";
import type { RunRequest, RunResult, Problem, TestCase } from "@/lib/types";
type Reference = {
  slug: string;
  js: string;
  typescript: string;
  python: string;
  cases: TestCase[];
  problem: Problem;
};
const references = JSON.parse(
  readFileSync("scripts/references.json", "utf8"),
) as Reference[];

it("all foundation answer hints pass their checks in the dedicated runner", async () => {
  const topics = JSON.parse(readFileSync("src/data/topic-foundations.json", "utf8")) as { id: string; stepIds: string[] }[];
  for (const summary of topics) {
    const topic = JSON.parse(readFileSync(`public/foundation-data/${summary.id}.json`, "utf8")) as import("@/lib/topic-foundations").FoundationTopic;
    expect(topic.foundation.steps.length).toBeGreaterThanOrEqual(3);
    expect(topic.foundation.steps.length).toBeLessThanOrEqual(6);
    expect(topic.foundation.steps.at(-1)?.recall).toBeDefined();
    for (const step of topic.foundation.steps) {
      const answer = step.hints[2].slice(step.hints[2].indexOf("\n") + 1).split("\nFollow the example")[0].split("\nThe + sign")[0].split("\nMultiply first")[0];
      const result = await run({ code: answer, functionName: step.functionName, mode: "function", cases: step.validate, timeLimitMs: 2000, inputKinds: step.inputKinds });
      expect(result.verdict, `${topic.id}/${step.id}: ${JSON.stringify(result)}`).toBe("accepted");
    }
  }
}, 60000);
const dir = resolve("artifacts/test-workers");
let sharedWorker: Worker | undefined;
afterAll(async () => { await sharedWorker?.terminate(); });
beforeAll(() => {
  mkdirSync(dir, { recursive: true });
  for (const name of ["compare", "nodes"])
    writeFileSync(
      `${dir}/${name}.mjs`,
      transform(readFileSync(`src/lib/harness/${name}.ts`, "utf8"), {
        transforms: ["typescript"],
      }).code,
    );
  const code = readFileSync("src/lib/runners/js.worker.ts", "utf8")
    .replace("@/lib/harness/compare", "./compare.mjs")
    .replace("@/lib/harness/nodes", "./nodes.mjs")
    .replace("./program-shim", "./program-shim.mjs");
  writeFileSync(`${dir}/program-shim.mjs`,transform(readFileSync("src/lib/runners/program-shim.ts","utf8"),{transforms:["typescript"]}).code);
  writeFileSync(
    `${dir}/js.worker.mjs`,
    transform(code, { transforms: ["typescript"] }).code,
  );
  writeFileSync(
    `${dir}/bridge.mjs`,
    "import {parentPort} from 'node:worker_threads'; globalThis.self={postMessage:m=>parentPort.postMessage(m)};await import('./js.worker.mjs');parentPort.on('message',data=>self.onmessage({data}));",
  );
});
function run(
  req: RunRequest,
  language = "javascript",
  timeout = 5000,
): Promise<RunResult> {
  return new Promise((resolveRun) => {
    // Reference batches reuse the actual harness; termination checks get their own worker.
    const isolated = timeout < 5000;
    const worker = isolated ? new Worker(`${dir}/bridge.mjs`) : (sharedWorker ??= new Worker(`${dir}/bridge.mjs`));
    const timer = setTimeout(() => {
      void worker.terminate();
      if (!isolated) sharedWorker = undefined;
      resolveRun({ verdict: "time_limit", cases: [] });
    }, timeout);
    worker.once("message", (r) => {
      clearTimeout(timer);
      worker.removeAllListeners("error");
      if (isolated) void worker.terminate();
      resolveRun(r);
    });
    worker.once("error", (e) => {
      clearTimeout(timer);
      void worker.terminate();
      if (!isolated) sharedWorker = undefined;
      resolveRun({
        verdict: "runtime_error",
        cases: [],
        compileError: { message: e.message },
      });
    });
    worker.postMessage({ ...req, language });
  });
}
function request(ref: Reference, code = ref.js): RunRequest {
  return { ...ref.problem, code, cases: ref.cases };
}
describe("actual JavaScript / TypeScript worker harness", () => {
  for (const ref of references) {
    it(`accepts ${ref.slug}, including every hidden case`, async () => {
      expect(ref.cases.length).toBeGreaterThanOrEqual(8);
      const r = await run(request(ref));
      expect(r.compileError?.message).toBeUndefined();
      expect(r.verdict, JSON.stringify(r.cases.filter((c) => !c.passed))).toBe(
        "accepted",
      );
      expect(r.cases).toHaveLength(ref.cases.length);
      const ts = await run(
        request(ref, ref.typescript),
        "typescript",
      );
      expect(ts.verdict).toBe("accepted");
    });
  }
  it("terminates infinite loops without blocking the caller", async () => {
    const before = Date.now();
    const result = await run(
      request(references[0], `function ${references[0].problem.functionName}(){while(true){}}`),
      "javascript",
      200,
    );
    expect(result.verdict).toBe("time_limit");
    expect(Date.now() - before).toBeLessThan(3000);
  });
  it("captures wrong output, exceptions, syntax errors, and stdout", async () => {
    const ref = references[0];
    expect(
      (await run(request(ref, `function ${references[0].problem.functionName}(){return null}`))).verdict,
    ).toBe("wrong_answer");
    expect(
      (await run(request(ref, `function ${references[0].problem.functionName}(){throw new Error("oops")}`)))
        .verdict,
    ).toBe("runtime_error");
    expect((await run(request(ref, `function ${references[0].problem.functionName}( {`))).verdict).toBe(
      "compile_error",
    );
    const result = await run(
      request(ref, ref.js.replace("{", '{console.log("hello");')),
    );
    expect(result.cases[0].stdout).toBe("hello");
  });
  it("runs UTF-8 stdin programs through fs, readline events and async iteration",async()=>{
    for(const code of [
      'const fs=require("fs"); const [a,b]=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number); console.log(a+b);',
      'const rl=require("readline").createInterface({input:process.stdin});let sum=0;rl.on("line",line=>{sum+=Number(line)});rl.on("close",()=>console.log(sum));',
      '(async()=>{const rl=require("readline").createInterface({input:process.stdin});let sum=0;for await(const line of rl)sum+=Number(line);console.log(sum);})();',
    ]) {const result=await run({code,mode:"program",functionName:"main",timeLimitMs:2000,cases:[{id:"stdin",input:[],stdin:"8\n9\n",expected:"17"}]});expect(result.verdict,JSON.stringify(result)).toBe("accepted");}
  });
  it("retains operations mode for build-style structures",async()=>{
    const result=await run({code:'class Counter { constructor(){this.value=0;} add(n){this.value+=n;} read(){return this.value;} }',mode:"operations",functionName:"Counter",timeLimitMs:2000,cases:[{id:"ops",input:[["Counter","add","read"],[[],[7],[]]],expected:[null,null,7]}]});expect(result.verdict).toBe("accepted");
  });
});
describe("Python reference solutions in the exact Python harness", () => {
  it("passes every reference against every visible and hidden case", () => {
    const result = spawnSync("python", ["scripts/test-python.py"], {
      input: JSON.stringify(references),
      encoding: "utf8",
      maxBuffer: 30 * 1024 * 1024,
    });
    expect(result.status, result.stderr).toBe(0);
    const responses = JSON.parse(result.stdout) as RunResult[];
    for (let i = 0; i < references.length; i++) {
      expect(responses[i].verdict, references[i].slug).toBe("accepted");
      for (const c of responses[i].cases)
        expect(
          compare(c.actual, c.expected, references[i].problem.comparison),
          `${references[i].slug}: ${JSON.stringify(c)}`,
        ).toBe(true);
    }
  }, 20000);
});
