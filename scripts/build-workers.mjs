import {build} from "esbuild";
import fs from "node:fs";
import {createHash} from "node:crypto";
const inputs=["src/lib/runners/js.worker.ts","src/lib/runners/strict-types.ts","src/lib/runners/program-shim.ts","src/lib/harness/compare.ts","src/lib/harness/nodes.ts","package-lock.json"];
const hash=createHash("sha256");for(const input of inputs)hash.update(fs.readFileSync(input));
const digest=hash.digest("hex"),stamp="public/runners/js/build.txt";
if(!fs.existsSync(stamp)||fs.readFileSync(stamp,"utf8")!==digest){
 await build({entryPoints:{worker:"src/lib/runners/js.worker.ts"},outdir:"public/runners/js",bundle:true,format:"esm",splitting:true,chunkNames:"[name]-[hash]",platform:"browser",target:"es2022",minify:true,tsconfig:"tsconfig.json"});
 fs.writeFileSync(stamp,digest);
 console.log("Disposable JavaScript/TypeScript worker built; strict compiler stays in a lazy chunk.");
}
