import "server-only";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getProblems } from "../problems";
import type { JudgeLanguage } from "../judge0/contracts";
import type { TestCase } from "../types";

// The 500 catalog problems are function-style (JSON arguments in, a value out) and are graded locally
// for guests. Rooms judge on the server, so each eligible problem is adapted to the judge's stdin
// format: the wrapper below reads one JSON case, calls the learner's function, compares the result
// and prints PASS or FAIL. The expected value travels inside stdin, so it never reaches the browser.
export const CATALOG_LANGUAGES = ["javascript", "python"] as const satisfies readonly JudgeLanguage[];
export type CatalogLanguage = (typeof CATALOG_LANGUAGES)[number];
interface FullCatalogProblem {
  id: string; slug: string; title: string; difficulty: "easy" | "medium" | "hard"; descriptionMd: string; functionName: string;
  mode: string; starterCode: Record<string, string>; cases: TestCase[]; parameterNames?: string[];
  inputKinds?: Record<string, string>; outputKind?: string; comparison?: { unordered?: boolean; floatTolerance?: number };
  privateData?: { hiddenCases?: TestCase[] }; constraints?: string[];
}
const cache = new Map<string, FullCatalogProblem | null>();
export function loadCatalogProblem(problemId: string): FullCatalogProblem | null {
  if (cache.has(problemId)) return cache.get(problemId) ?? null;
  const entry = getProblems().find(item => item.id === problemId);
  let value: FullCatalogProblem | null = null;
  if (entry) {
    try { value = JSON.parse(readFileSync(`src/data/problems/level-${entry.level}/${entry.unit}/${entry.slug}.json`, "utf8")) as FullCatalogProblem; }
    catch { value = null; }
  }
  cache.set(problemId, value);
  return value;
}
/** Plain function problems only: no linked-list or tree conversion, no custom comparison. */
export const catalogEligible = (problem: FullCatalogProblem | null): problem is FullCatalogProblem => !!problem && problem.mode === "function" &&
  /^[A-Za-z_$][\w$]*$/.test(problem.functionName) && !(problem.inputKinds && Object.keys(problem.inputKinds).length) && !problem.outputKind &&
  !problem.comparison?.unordered && !problem.comparison?.floatTolerance && CATALOG_LANGUAGES.every(language => typeof problem.starterCode?.[language] === "string") &&
  problem.cases.length > 0;

export function searchCatalog(query: string, limit: number) {
  const needle = query.trim().toLowerCase();
  const matches = getProblems().filter(item => !needle || item.title.toLowerCase().includes(needle) || item.id.includes(needle) ||
    item.topics.some(topic => topic.toLowerCase().includes(needle)));
  const found: { id: string; title: string; difficulty: string; level: number }[] = [];
  for (const item of matches) {
    if (!catalogEligible(loadCatalogProblem(item.id))) continue;
    found.push({ id: item.id, title: item.title, difficulty: item.difficulty, level: item.level });
    if (found.length >= limit) break;
  }
  return found;
}

const show = (value: unknown) => JSON.stringify(value);
export function catalogCases(problem: FullCatalogProblem) {
  const visible = problem.cases.map(item => ({ item, hidden: false }));
  const hidden = (problem.privateData?.hiddenCases ?? []).map(item => ({ item, hidden: true }));
  return [...visible, ...hidden].map(({ item, hidden: isHidden }, index) => ({ id: item.id ?? `case-${index + 1}`,
    stdin: show({ a: item.input, e: item.expected, s: isHidden ? 0 : 1 }), expected: "PASS", hidden: isHidden }));
}
export function catalogExamples(problem: FullCatalogProblem) {
  const names = problem.parameterNames ?? [];
  return problem.cases.map((item, index) => ({ id: item.id ?? `case-${index + 1}`,
    stdin: item.input.map((value, position) => `${names[position] ?? `arg${position + 1}`} = ${show(value)}`).join("\n"), expected: show(item.expected) }));
}
export const catalogTestsHash = (problem: FullCatalogProblem) => createHash("sha256")
  .update(JSON.stringify([problem.cases, problem.privateData?.hiddenCases ?? []])).digest("hex").slice(0, 32);

// Stray prints from the learner (at load time or inside the function) must not corrupt the PASS line,
// so output is muted by a short head placed before their code and restored by the tail.
const JS_HEAD = "var __iwonsLog = console.log; console.log = function () {};" + String.fromCharCode(10);
const JS = (name: string) => `
;(function () {
  function same(a, b) {
    if (typeof a === "number" && typeof b === "number") return a === b;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every(function (item, i) { return same(item, b[i]); });
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      var keys = Object.keys(b);
      return Object.keys(a).length === keys.length && keys.every(function (k) { return Object.prototype.hasOwnProperty.call(a, k) && same(a[k], b[k]); });
    }
    return a === b;
  }
  function run(raw) {
    var data = JSON.parse(raw), got = ${name}.apply(null, data.a);
    if (same(got, data.e)) return "PASS";
    if (!data.s) return "FAIL";
    var text; try { text = JSON.stringify(got); } catch (e) { text = String(got); }
    return "FAIL got=" + text;
  }
  var out;
  try { out = run(require("fs").readFileSync(0, "utf8")); } finally { console.log = __iwonsLog; }
  console.log(out);
})();
`;
const PY_HEAD = ["import sys as __sys, json as __json, io as __io", "__iwons_out = __sys.stdout", "__sys.stdout = __io.StringIO()", ""].join(String.fromCharCode(10));
const PY = (name: string) => `
def __iwons_norm(v):
    if isinstance(v, (list, tuple)):
        return [__iwons_norm(i) for i in v]
    if isinstance(v, dict):
        return {str(k): __iwons_norm(i) for k, i in v.items()}
    return v
def __iwons_same(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a == b
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(__iwons_same(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(__iwons_same(a[k], b[k]) for k in b)
    return a == b and type(a) == type(b)
def __iwons_run(raw):
    data = __json.loads(raw)
    got = __iwons_norm(${name}(*data["a"]))
    if __iwons_same(got, data["e"]):
        return "PASS"
    if not data.get("s"):
        return "FAIL"
    try:
        text = __json.dumps(got)
    except Exception:
        text = repr(got)
    return "FAIL got=" + text
try:
    __iwons_result = __iwons_run(__sys.stdin.read())
finally:
    __sys.stdout = __iwons_out
print(__iwons_result)
`;
/** Appends the adapter to the learner's code. The function name is validated by catalogEligible. */
export function wrapCatalog(language: CatalogLanguage, code: string, functionName: string) {
  return language === "javascript" ? `${JS_HEAD}${code}\n${JS(functionName)}` : `${PY_HEAD}${code}\n${PY(functionName)}`;
}
