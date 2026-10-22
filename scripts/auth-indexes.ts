import nextEnv from "@next/env";
import { CredentialIndexError, createCredentialUserIndexes, inspectCredentialUserIndexes } from "../src/lib/db/credential-user-indexes";

const args = process.argv.slice(2);
if (args.some(arg => !["--check", "--apply"].includes(arg)) || args.includes("--check") && args.includes("--apply")) {
  console.error("Usage: npm run db:auth -- --check|--apply (default: --check)");
  process.exitCode = 2;
} else {
  nextEnv.loadEnvConfig(process.cwd());
  const { database } = await import("../src/lib/db/client");
  try {
    const db = await database();
    const apply = args.includes("--apply");
    const plan = apply ? await createCredentialUserIndexes(db) : await inspectCredentialUserIndexes(db);
    console.log(JSON.stringify({ mode: apply ? "applied" : "check", collection: "users", ...plan }, null, 2));
    if (Object.values(plan.conflicts).some(count => count > 0)) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof CredentialIndexError ? error.message : "Account index setup failed. Check MONGODB_URI, MONGODB_DB, and database access.");
    process.exitCode = 1;
  } finally {
    const pooled = globalThis as typeof globalThis & { iwonsMongo?: Promise<import("mongodb").MongoClient> };
    await pooled.iwonsMongo?.then(client => client.close()).catch(() => {});
  }
}
