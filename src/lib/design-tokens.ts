import { readFileSync } from "node:fs";
import { join } from "node:path";
const tokens = readFileSync(
  join(process.cwd(), "src/styles/tokens.css"),
  "utf8",
).split(":root[data-theme=")[0];
const colors = Object.fromEntries(
  [...tokens.matchAll(/--([\w-]+):\s*(#[A-Fa-f0-9]{6})/g)].map((m) => [
    m[1],
    m[2],
  ]),
);
export const palette = { ...colors, text: colors.ink, border: colors.ink } as Record<string, string>;
