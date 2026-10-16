import { transform } from "sucrase";
import { compare } from "@/lib/harness/compare";
import {
  ListNode,
  TreeNode,
  buildList,
  buildTree,
  serializeNode,
} from "@/lib/harness/nodes";
import type { RunRequest, RunResult, CaseResult, Language } from "@/lib/types";
const scope = self as unknown as {
  onmessage:
    ((event: MessageEvent<RunRequest & { language: Language }>) => void) | null;
  postMessage: (message: RunResult) => void;
};
scope.onmessage = async (
  event: MessageEvent<RunRequest & { language: Language }>,
) => {
  const req = event.data;
  const results: CaseResult[] = [];
  let code = req.code;
  try {
    code = transform(code, {
      transforms: req.language === "typescript" ? ["typescript"] : [],
      filePath: req.language === "typescript" ? "solution.ts" : "solution.js",
      disableESTransforms: true,
    }).code;
    // Function is confined to this disposable worker; the UI thread never evaluates code.
    new Function(code);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const line = message.match(/\((\d+):\d+\)/)?.[1];
    scope.postMessage({
      verdict: "compile_error",
      cases: [],
      compileError: { message, ...(line ? { line: Number(line) } : {}) },
    } satisfies RunResult);
    return;
  }
  for (const test of req.cases) {
    const start = performance.now();
    const logs: string[] = [];
    try {
      const print = (...values: unknown[]) => {
        if (logs.join("").length < 10000)
          logs.push(
            values
              .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
              .join(" "),
          );
      };
      const fn = new Function(
        "console",
        "ListNode",
        "TreeNode",
        `${code}\n;return typeof ${req.functionName} !== 'undefined' ? ${req.functionName} : undefined;`,
      )(
        { log: print, warn: print, error: print, info: print },
        ListNode,
        TreeNode,
      );
      if (typeof fn !== "function")
        throw new Error(`Define ${req.functionName} as shown in the starter.`);
      const args = structuredClone(test.input);
      let actual: unknown;
      if (req.mode === "operations") {
        const operations = args[0] as string[],
          params = args[1] as unknown[][];
        let instance: Record<string, (...a: unknown[]) => unknown>;
        actual = [];
        for (let i = 0; i < operations.length; i++) {
          if (i === 0) {
            instance = new fn(...params[i]);
            (actual as unknown[]).push(null);
          } else
            (actual as unknown[]).push(
              (await instance![operations[i]](...params[i])) ?? null,
            );
        }
      } else {
        for (const [index, kind] of Object.entries(req.inputKinds ?? {})) {
          const k = Number(index);
          args[k] =
            kind === "tree"
              ? buildTree(args[k] as (number | null)[])
              : kind === "cycle"
                ? buildList(
                    (args[k] as { values: number[]; pos: number }).values,
                    (args[k] as { pos: number }).pos,
                  )
                : buildList(args[k] as number[]);
        }
        actual = serializeNode(await fn(...args), req.outputKind);
      }
      const serialized = JSON.parse(JSON.stringify(actual ?? null));
      results.push({
        id: test.id,
        passed: compare(serialized, test.expected, req.comparison),
        expected: test.expected,
        actual: serialized,
        stdout: logs.join("\n"),
        runtimeMs: performance.now() - start,
      });
    } catch (e) {
      results.push({
        id: test.id,
        passed: false,
        expected: test.expected,
        actual: null,
        stdout: logs.join("\n"),
        runtimeMs: performance.now() - start,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      });
    }
  }
  scope.postMessage({
    verdict: results.some((r) => r.error)
      ? "runtime_error"
      : results.every((r) => r.passed)
        ? "accepted"
        : "wrong_answer",
    cases: results,
  } satisfies RunResult);
};
