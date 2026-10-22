// Shared pieces for the per-module Foundation authoring files.
export const TRIP = "This trips up lots of people. ";
export const L = (...lines) => lines.join("\n");
export const readAll = 'require("fs").readFileSync(0, "utf8")';
// Input lines, and a line of whole numbers, in each language.
export const readLines = `${readAll}.trim().split("\\n")`;
export const jsNumbers = `${readAll}.trim().split(" ").map(Number)`;
export const pyNumbers = "list(map(int, input().split()))";
/** A concept-check question: the right option is `answer` (an index). */
export const q = (prompt, options, answer, explanation, hint) => ({ prompt, options, answer, explanation, hint });
