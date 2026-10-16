import fs from "node:fs";
fs.mkdirSync("public/monaco", { recursive: true });
const version = JSON.parse(
  fs.readFileSync("node_modules/monaco-editor/package.json", "utf8"),
).version;
const copied = fs.existsSync("public/monaco/version.txt")
  ? fs.readFileSync("public/monaco/version.txt", "utf8")
  : "";
if (!fs.existsSync("public/monaco/vs/loader.js") || copied !== version)
  fs.cpSync("node_modules/monaco-editor/min/vs", "public/monaco/vs", {
    recursive: true,
  });
fs.writeFileSync("public/monaco/version.txt", version);
console.log("Monaco assets ready (self-hosted).");
