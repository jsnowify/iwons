import { readFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("public/og/manifest.json", "utf8")) as Record<string, {file:string}>;
export const ogImage = (slug:string) => `/og/${manifest[slug]?.file ?? manifest.home.file}`;
