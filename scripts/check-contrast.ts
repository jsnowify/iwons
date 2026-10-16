import fs from "node:fs";
import assert from "node:assert/strict";
const css = fs.readFileSync("src/styles/tokens.css", "utf8");
function declarations(block: string) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}
const paper = declarations(css.match(/:root\s*\{([^}]+)\}/s)![1]);
const night = { ...paper, ...declarations(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/s)![1]) };
function rgb(value: string, tokens: Record<string, string>): number[] {
  if (value.startsWith("var(")) return rgb(tokens[value.slice(4, -1)], tokens);
  const hex = value.match(/^#([\da-f]{6})$/i);
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16));
  const mix = value.match(/^color-mix\(in srgb, (var\([^)]+\)) (\d+)%, (var\([^)]+\))\)$/);
  if (mix) { const a = rgb(mix[1], tokens), b = rgb(mix[3], tokens), p = Number(mix[2]) / 100; return a.map((v, i) => v * p + b[i] * (1 - p)); }
  throw new Error(`Unsupported color: ${value}`);
}
function luminance(c: number[]) { return c.map(v => { const x = v / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0); }
const checks: [string, string, number][] = [];
for (const surface of ["bg", "surface", "elevated"]) {
  for (const ink of ["text", "muted"]) checks.push([ink, surface, 4.5]);
  checks.push(["border", surface, 3]);
  for (const ink of ["accent-text", "success-text", "danger-text", "warning-text", "code-comment"]) checks.push([ink, surface, 4.5]);
}
for (const fill of ["accent", "accent-2", "accent-3"]) checks.push(["on-accent", fill, 4.5], ["key-border", fill, 3]);
const report = [];
for (const [theme, tokens] of Object.entries({ paper, night })) {
  const pairs = theme === "night" ? [...checks, ["shadow-ink", "bg", 3] as [string, string, number], ...["heat-empty", "heat-1", "heat-2", "heat-3"].map(v => [v, "surface", 3] as [string, string, number])] : checks;
  for (const [fg, bg, minimum] of pairs) {
    const a = luminance(rgb(tokens[`--${fg}`], tokens)), b = luminance(rgb(tokens[`--${bg}`], tokens));
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    report.push({ theme, foreground: fg, background: bg, ratio: +ratio.toFixed(2), minimum });
  }
}
fs.mkdirSync("artifacts", { recursive: true });
fs.writeFileSync("artifacts/contrast.json", JSON.stringify(report, null, 2));
const failures = report.filter(p => p.ratio < p.minimum);
assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
console.log(`Contrast: ${report.length} token pairs passed in Paper and Night.`);
