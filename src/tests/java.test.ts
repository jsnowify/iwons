import { it, expect } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const allReferences = JSON.parse(readFileSync("scripts/references.json", "utf8"));
const references = [allReferences[0], allReferences[300], allReferences[499]];
import type { RunResult } from "@/lib/types";
const hasJava =
  spawnSync("javac", ["-version"], { encoding: "utf8" }).status === 0;
it.skipIf(!hasJava)(
  "smoke-tests foundational, node and advanced Java references; unit validation covers the catalog",
  () => {
    const dir = resolve("artifacts/java-tests");
    mkdirSync(dir, { recursive: true });
    const template = readFileSync("public/runners/JavaHarness.txt", "utf8");
    for (const ref of references) {
      const code = ref.java;
      writeFileSync(
        `${dir}/Main.java`,
        template.replace("/* IWONS_USER_CODE */", code),
      );
      const compile = spawnSync("javac", ["Main.java"], {
        cwd: dir,
        encoding: "utf8",
        timeout: 20000,
      });
      expect(compile.status, compile.stderr).toBe(0);
      const output = spawnSync("java", ["-cp", dir, "Main"], {
        input: JSON.stringify({ ...ref.problem, cases: ref.cases }),
        encoding: "utf8",
        timeout: 10000,
      });
      expect(output.status, output.stderr).toBe(0);
      const result = JSON.parse(output.stdout) as RunResult;
      expect(result.verdict, output.stdout).toBe("accepted");
      expect(result.cases).toHaveLength(ref.cases.length);
      for (const c of result.cases) expect(c.actual).toEqual(c.expected);
    }
  },
  120000,
);
