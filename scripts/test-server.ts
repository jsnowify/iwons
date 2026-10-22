// Browser tests use an isolated local database. They never create accounts or
// example email records in the configured Atlas project.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createAccountIndexes } from "../src/lib/db/accounts";
import { createJudgeIndexes, serverProblem, type ServerProblem } from "../src/lib/db/judge-repository";
import { judgeDemoProblem } from "./curriculum/judge-problem.mjs";

const memory = await MongoMemoryServer.create({ binary: { version: "8.0.12" } });
const uri = memory.getUri();
const client = await new MongoClient(uri).connect();
try {
  const db = client.db("iwons_browser_tests");
  await createAccountIndexes(db); await createJudgeIndexes(db);
  await db.collection<ServerProblem>("judge_problems").insertOne(serverProblem.parse(judgeDemoProblem()));
} finally { await client.close(); }
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "4173"], {
  stdio: "inherit", windowsHide: true,
  env: { ...process.env, NODE_ENV: "production", AUTH_SECRET: randomBytes(32).toString("base64"),
    AUTH_URL: "http://127.0.0.1:4173", MONGODB_URI: uri, MONGODB_DB: "iwons_browser_tests", TRUSTED_IP_HEADER: "x-forwarded-for" },
});
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  child.kill();
  await memory.stop();
  process.exitCode = code;
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
child.once("exit", code => void stop(code ?? 0));
