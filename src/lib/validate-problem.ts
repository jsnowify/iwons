import type { Problem, PrivateProblem, TestCase } from "./types";
import { cleanBlock, cleanText } from "./text";
const languages = ["javascript", "typescript", "python", "java"] as const;
export function validateCases(value: unknown, name = "Cases"): TestCase[] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    throw new Error(`${name} must be an array of 1–100 cases.`);
  return value.map((c, i) => {
    if (
      !c ||
      typeof c !== "object" ||
      !Array.isArray(c.input) ||
      !Object.hasOwn(c, "expected")
    )
      throw new Error(
        `${name}, case ${i + 1}: supply input (an argument array) and expected.`,
      );
    return {
      id: String(c.id ?? `${name.toLowerCase()}-${i}`),
      input: c.input,
      expected: c.expected,
    };
  });
}
function shortList(value: unknown, count: number, length: number, fallback: string[]) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return fallback;
  const items = value.slice(0, count).map((item) => cleanText(item, length)).filter(Boolean);
  return items.length ? items : fallback;
}
export function validateProblem(value: unknown): Problem {
  if (!value || typeof value !== "object")
    throw new Error("Provide a problem object.");
  const p = value as Record<string, unknown>;
  for (const field of ["title", "descriptionMd", "functionName"])
    if (typeof p[field] !== "string" || !(p[field] as string).trim())
      throw new Error(`Missing ${field}.`);
  if (!/^[A-Za-z_$][\w$]*$/.test(p.functionName as string))
    throw new Error("Use a valid function name.");
  if (!["easy", "medium", "hard"].includes(p.difficulty as string))
    throw new Error("Difficulty must be easy, medium, or hard.");
  if (
    !p.starterCode ||
    typeof p.starterCode !== "object" ||
    languages.some(
      (l) => typeof (p.starterCode as Record<string, unknown>)[l] !== "string",
    )
  )
    throw new Error("Provide starterCode for all four languages.");
  if ((p.title as string).length > 400 || (p.descriptionMd as string).length > 20_000)
    throw new Error("Keep the title under 100 characters and the description under 20,000.");
  for (const language of languages)
    if (((p.starterCode as Record<string, string>)[language]).length > 20_000)
      throw new Error("Keep each starter under 20,000 characters.");
  const cases = validateCases(p.cases);
  const rawPrivate =
    p.privateData && typeof p.privateData === "object"
      ? (p.privateData as Record<string, unknown>)
      : { hiddenCases: p.hiddenCases ?? [], editorialMd: p.editorialMd ?? "" };
  const hidden = rawPrivate.hiddenCases ?? [];
  if (!Array.isArray(hidden))
    throw new Error("Hidden cases must be a JSON array.");
  const privateData: PrivateProblem = {
    hiddenCases: hidden.length ? validateCases(hidden, "Hidden cases") : [],
    editorialMd:
      typeof rawPrivate.editorialMd === "string" ? cleanBlock(rawPrivate.editorialMd, 20_000) : "",
  };
  const id =
    typeof p.id === "string" && /^custom-[a-zA-Z0-9-]+$/.test(p.id)
      ? p.id
      : `custom-${crypto.randomUUID()}`;
  return {
    id,
    level:typeof p.level==="number"?p.level:0,prerequisites:Array.isArray(p.prerequisites)?p.prerequisites:[],
    slug: id,
    title: cleanText(p.title as string, 100) || "Untitled problem",
    descriptionMd: cleanBlock(p.descriptionMd as string, 20_000),
    functionName: p.functionName as string,
    difficulty: p.difficulty as Problem["difficulty"],
    mode: p.mode === "operations" ? "operations" : "function",
    starterCode: p.starterCode as Problem["starterCode"],
    cases,
    topics: shortList(p.topics, 10, 40, ["Custom"]),
    patterns: shortList(p.patterns, 10, 40, ["Custom"]),
    constraints:
      Array.isArray(p.constraints) &&
      p.constraints.every((t) => typeof t === "string")
        ? p.constraints
        : [],
    hints:
      Array.isArray(p.hints) && p.hints.every((t) => typeof t === "string")
        ? p.hints
        : [],
    timeLimitMs: Math.min(10000, Math.max(100, Number(p.timeLimitMs) || 2000)),
    overview:
      typeof p.overview === "string"
        ? p.overview
        : "A challenge from your own collection.",
    complexity: { time: "Your approach", space: "Your approach" },
    javaParams:
      Array.isArray(p.javaParams) &&
      p.javaParams.every((v) => typeof v === "string")
        ? p.javaParams
        : [],
    privateData,
    ...(p.inputKinds &&
    typeof p.inputKinds === "object" &&
    !Object.entries(p.inputKinds).some(
      ([key, value]) =>
        !/^\d+$/.test(key) ||
        !["list", "tree", "cycle"].includes(String(value)),
    )
      ? { inputKinds: p.inputKinds as Problem["inputKinds"] }
      : {}),
    ...(p.outputKind === "list" || p.outputKind === "tree"
      ? { outputKind: p.outputKind }
      : {}),
    ...(p.comparison && typeof p.comparison === "object"
      ? {
          comparison: {
            unordered:
              (p.comparison as Record<string, unknown>).unordered === true,
            floatTolerance: Math.max(
              0,
              Number(
                (p.comparison as Record<string, unknown>).floatTolerance,
              ) || 0,
            ),
          },
        }
      : {}),
  };
}
