import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const { database } = await import("../src/lib/db/client");
const { createJudgeIndexes } = await import("../src/lib/db/judge-repository");
const { createAccountIndexes } = await import("../src/lib/db/accounts");
try {
  await createJudgeIndexes(await database());
  await createAccountIndexes(await database());
  console.log("Judge TTL, problem, account, sync, submission and leaderboard indexes are ready.");
} catch {
  console.error("Database initialization failed. Check MONGODB_URI and MONGODB_DB.");
  process.exitCode = 1;
}
const pooled = globalThis as typeof globalThis & { iwonsMongo?: Promise<import("mongodb").MongoClient> };
await pooled.iwonsMongo?.then(client => client.close()).catch(() => {});
