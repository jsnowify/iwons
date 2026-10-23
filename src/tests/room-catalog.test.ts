import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { getProblems } from "@/lib/problems";
import { catalogCases, catalogEligible, catalogExamples, catalogTestsHash, loadCatalogProblem, searchCatalog, wrapCatalog } from "@/lib/rooms/catalog";

// Proves the stdin adapter used by rooms: every eligible catalog problem's reference solution must
// PASS every visible and hidden case through the exact wrapper text the judge would receive.
const refs = JSON.parse(readFileSync("scripts/references.json", "utf8")) as { slug: string; js: string; python: string }[];
const eligible = refs.flatMap(ref => {
  const entry = getProblems().find(item => item.slug === ref.slug);
  const problem = entry ? loadCatalogProblem(entry.id) : null;
  return catalogEligible(problem) ? [{ ref, problem }] : [];
});
const pythonAvailable = spawnSync("python", ["--version"]).status === 0;
function runJs(code: string, stdin: string) {
  const lines: string[] = [];
  const fake = { log: (...values: unknown[]) => { lines.push(values.join(" ")); } };
  new Function("require", "console", code)(() => ({ readFileSync: () => stdin }), fake);
  return lines.join(String.fromCharCode(10)).trim();
}
const driver = [
  "import sys, json, io", "jobs = json.loads(sys.stdin.read())", "out = {}", "for job in jobs:", "    res = []", "    try:",
  "        code = compile(job['code'], job['id'], 'exec')", "    except Exception as error:", "        out[job['id']] = ['COMPILE ' + str(error)]", "        continue",
  "    for stdin in job['cases']:", "        cap = io.StringIO()", "        sys.stdout = cap", "        sys.stdin = io.StringIO(stdin)", "        try:",
  "            exec(code, {'__name__': '__main__'})", "            res.append(cap.getvalue().strip())", "        except BaseException as error:",
  "            res.append('ERROR ' + repr(error))", "        finally:", "            sys.stdout = sys.__stdout__", "    out[job['id']] = res",
  "sys.stdout = sys.__stdout__", "print(json.dumps(out))"].join(String.fromCharCode(10));

describe("catalog problems in rooms", () => {
  it("adapts most of the catalog and leaves tree/list conversion problems out", () => {
    expect(eligible.length).toBeGreaterThan(400);
    for (const { problem } of eligible) {
      const cases = catalogCases(problem);
      expect(cases.some(item => item.hidden) && cases.some(item => !item.hidden), problem.id).toBe(true);
      expect(cases.every(item => item.expected === "PASS")).toBe(true);
      expect(catalogExamples(problem).length).toBe(problem.cases.length);
    }
    expect(searchCatalog("", 30).length).toBe(30);
    expect(catalogTestsHash(eligible[0].problem)).toMatch(/^[a-f0-9]{32}$/);
  });
  it("passes every reference solution on every visible and hidden case in JavaScript", () => {
    const failures: string[] = [];
    for (const { ref, problem } of eligible) {
      const code = wrapCatalog("javascript", ref.js, problem.functionName);
      for (const item of catalogCases(problem)) {
        let output: string;
        try { output = runJs(code, item.stdin); } catch (error) { output = "THROW " + String(error); }
        if (output !== "PASS") failures.push(`${problem.id}/${item.id}: ${output.slice(0, 80)}`);
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  }, 120_000);
  it.skipIf(!pythonAvailable)("passes every reference solution on every visible and hidden case in Python", () => {
    const jobs = eligible.map(({ ref, problem }) => ({ id: problem.id, code: wrapCatalog("python", ref.python, problem.functionName),
      cases: catalogCases(problem).map(item => item.stdin) }));
    const done = spawnSync("python", ["-I", "-c", driver], { encoding: "utf8", input: JSON.stringify(jobs), timeout: 110_000, maxBuffer: 50_000_000 });
    expect(done.status, done.stderr).toBe(0);
    const results = JSON.parse(done.stdout) as Record<string, string[]>;
    const failures: string[] = [];
    for (const { problem } of eligible) results[problem.id].forEach((output, index) => { if (output !== "PASS") failures.push(`${problem.id}#${index}: ${output.slice(0, 80)}`); });
    expect(failures.slice(0, 10)).toEqual([]);
  }, 120_000);
  it("ignores stray prints, reports wrong answers and keeps hidden expectations out of the output", () => {
    const { problem } = eligible[0];
    const visible = catalogCases(problem).find(item => !item.hidden)!, hidden = catalogCases(problem).find(item => item.hidden)!;
    const noisy = `console.log("debug at load"); function ${problem.functionName}() { console.log("inside"); return "wrong"; }`;
    const wrong = runJs(wrapCatalog("javascript", noisy, problem.functionName), visible.stdin);
    expect(wrong.startsWith("FAIL got=")).toBe(true);
    expect(wrong).not.toContain("debug");
    expect(runJs(wrapCatalog("javascript", noisy, problem.functionName), hidden.stdin)).toBe("FAIL");
    expect(() => runJs(wrapCatalog("javascript", "const x = 1;", problem.functionName), visible.stdin)).toThrow();
  });
});
