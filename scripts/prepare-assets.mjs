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
// Existing dev dependency; loaded only by the optional strict TypeScript worker.
fs.mkdirSync("public/runners/ts-lib", {recursive:true});
for (const name of fs.readdirSync("node_modules/typescript/lib").filter(name=>/^lib\..*\.d\.ts$/.test(name))) {
  fs.copyFileSync(`node_modules/typescript/lib/${name}`,`public/runners/ts-lib/${name}`);
}
