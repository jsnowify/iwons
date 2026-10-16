import fs from "node:fs";
import path from "node:path";
const excluded = new Set([
  "node_modules",
  ".next",
  "out",
  ".git",
  ".vercel",
  "artifacts",
  "test-results",
  "playwright-report",
  ".openai",
  "monaco",
]);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (
      excluded.has(e.name) ||
      e.name.startsWith(".env") ||
      e.name.endsWith("tsbuildinfo")
    )
      return [];
    const file = path.join(dir, e.name);
    return e.isDirectory()
      ? walk(file)
      : [
          {
            file: file.replaceAll("\\", "/"),
            data: fs.readFileSync(file).toString("base64"),
            encoding: "base64",
          },
        ];
  });
}
const files = walk(".");
const payload = JSON.stringify(files);
const chunks = [];
for (let i = 0; i < payload.length; i += 20000)
  chunks.push(payload.slice(i, i + 20000));
if (process.argv[2] === "count")
  console.log(
    JSON.stringify({
      chunks: chunks.length,
      files: files.length,
      bytes: files.reduce((n, f) => n + f.data.length, 0),
    }),
  );
else console.log(JSON.stringify(chunks[Number(process.argv[2] ?? 0)]));
