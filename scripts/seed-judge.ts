import nextEnv from "@next/env";
import { judgeDemoProblem } from "./curriculum/judge-problem.mjs";
nextEnv.loadEnvConfig(process.cwd());
const { database } = await import("../src/lib/db/client");
const { serverProblem } = await import("../src/lib/db/judge-repository");
try {
  const problem = serverProblem.parse(judgeDemoProblem());
  const { _id, ...fields } = problem;
  const db = await database();
  await db.collection<import("../src/lib/db/judge-repository").ServerProblem>("judge_problems").updateOne(
    { _id }, { $set: fields }, { upsert: true });
  console.log("Add Two Numbers seeded: two visible and three hidden cases.");
} catch {
  console.error("Judge problem seed failed. Check database configuration and run db:migrate.");
  process.exitCode = 1;
}
const pooled = globalThis as typeof globalThis & { iwonsMongo?: Promise<import("mongodb").MongoClient> };
await pooled.iwonsMongo?.then(client => client.close()).catch(() => {});
