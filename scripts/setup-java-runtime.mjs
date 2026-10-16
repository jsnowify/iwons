import { randomBytes } from "node:crypto";
import { mkdir, readFile, statfs, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Judge0's compiler image is large. Check the system drive before starting
// downloads; Docker Desktop stores its virtual disk there by default.
const disk = await statfs(process.env.LOCALAPPDATA || process.cwd());
const freeGB = Number(disk.bavail) * Number(disk.bsize) / 1024 ** 3;
if (freeGB < 20) {
  throw new Error(`Local Java setup needs at least 20 GB free before downloading images; only ${freeGB.toFixed(1)} GB is available. No runtime was started.`);
}
const directory = new URL("../artifacts/judge0-local/", import.meta.url);
await mkdir(directory, { recursive: true });
const configuration = new URL("judge0.conf", directory);
try {
  await readFile(configuration);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const response = await fetch("https://raw.githubusercontent.com/judge0/judge0/v1.13.1/judge0.conf");
  if (!response.ok) throw new Error(`Could not download Judge0 configuration: HTTP ${response.status}`);
  let text = await response.text();
  const values = {
    REDIS_PASSWORD: randomBytes(32).toString("hex"),
    POSTGRES_PASSWORD: randomBytes(32).toString("hex"),
    SECRET_KEY_BASE: randomBytes(64).toString("hex"),
    JUDGE0_TELEMETRY_ENABLE: "false",
    ENABLE_CALLBACKS: "false",
    ALLOW_ENABLE_NETWORK: "false",
    ENABLE_NETWORK: "false",
    ENABLE_COMPILER_OPTIONS: "true",
    ALLOWED_LANGUAGES_FOR_COMPILER_OPTIONS: '"Java"',
    ALLOW_ORIGIN: '"http://localhost:3000 http://127.0.0.1:3000 http://127.0.0.1:4173 http://127.0.0.1:4174"',
    COUNT: "2",
    RAILS_MAX_THREADS: "2",
    RAILS_SERVER_PROCESSES: "1",
    USE_DOCS_AS_HOMEPAGE: "true",
  };
  for (const [key, value] of Object.entries(values)) text = text.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  await writeFile(configuration, text, { mode: 0o600 });
}
execFileSync("docker", ["compose", "-f", "tools/java-runtime/compose.yml", "up", "-d", "--build"], { stdio: "inherit" });
console.log("Local Java containers started at http://127.0.0.1:2358. Execution is unverified: run the browser probes before enabling Java in Iwons.");
