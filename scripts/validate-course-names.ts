import fs from "node:fs";
import path from "node:path";
import { courseNamingErrors } from "../src/lib/foundations/naming.ts";

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : entry.name.endsWith(".html") ? [path.join(directory, entry.name)] : []);
}
const errors: string[] = [];
for (const file of ["out/index.html", ...walk("out/learn")]) {
  const html = fs.readFileSync(file, "utf8");
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  for (const error of courseNamingErrors(text)) errors.push(`${file}: ${error}`);
  for (const match of html.matchAll(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/gi)) {
    for (const error of courseNamingErrors(match[1])) errors.push(`${file} metadata: ${error}`);
  }
}
if (errors.length) throw new Error(errors.join("\n"));
console.log("Learner-facing course names passed in exported Learn pages and landing page.");
