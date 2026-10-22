import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const required = ["MONGODB_URI", "MONGODB_DB", "JUDGE0_URL"];
if (process.env.JUDGE0_RAPIDAPI_HOST) required.push("JUDGE0_RAPIDAPI_KEY");
if (process.env.JUDGE0_PROVIDER === "onlinecompiler") required.push("JUDGE0_AUTH_TOKEN");
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length) {
  console.error("Missing server environment entries: " + missing.join(", "));
  process.exit(1);
}
const { judgeClient, encoded, decoded } = await import("../src/lib/judge0/client");
const { resolveLanguage, languages } = await import("../src/lib/judge0/languages");
const { clampLimits, instanceLimits } = await import("../src/lib/judge0/limits");
const { database } = await import("../src/lib/db/client");
const { judgeRepository } = await import("../src/lib/db/judge-repository");
try {
  const client = judgeClient();
  const repo = judgeRepository(await database());
  const maximums = await instanceLimits(client, repo);
  for (const key of ["java", "python", "javascript"] as const) {
    const language = languages[key];
    const [token] = await client.submit([{ source_code: encoded(language.starterTemplate), stdin: encoded(""),
      expected_output: encoded("Hello World\n"), language_id: await resolveLanguage(key, client, repo),
      ...clampLimits(key, maximums) }]);
    const deadline = Date.now() + 60_000;
    let complete = false;
    while (Date.now() < deadline) {
      const [result] = await client.read([token]);
      if (result.status_id >= 3) {
        console.log(JSON.stringify({ language: key, status: result.status_id, stdout: decoded(result.stdout),
          compile_output: decoded(result.compile_output) }));
        if (result.status_id !== 3) throw new Error("Smoke program did not pass");
        complete = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!complete) throw new Error("Smoke program timed out");
  }
} catch {
  console.error("Live smoke test failed or is unconfigured. Check the server environment; no tokens or credentials were printed.");
  process.exitCode = 1;
}
const pooled = globalThis as typeof globalThis & { iwonsMongo?: Promise<import("mongodb").MongoClient> };
await pooled.iwonsMongo?.then(client => client.close()).catch(() => {});
