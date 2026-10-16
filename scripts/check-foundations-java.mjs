import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.IWONS_BASE_URL || "http://localhost:3000";
const judgeUrl = process.env.IWONS_JUDGE_URL || "";
const probes = [
  {
    name: "Hello World",
    stdin: "",
    expected: "Hello, World!",
    code: `public class Main {
    /** Prints the greeting. */
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  {
    name: "Scanner stdin",
    stdin: "7\n",
    expected: "14",
    code: `import java.util.Scanner;

public class Main {
    /** Reads and doubles one integer. */
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int count = scanner.nextInt();
        System.out.println(count * 2);
    }
}`,
  },
  {
    name: "Two classes",
    stdin: "",
    expected: "12",
    code: `public class Main {
    /** Prints a value supplied by a helper object. */
    public static void main(String[] args) {
        Receipt receipt = new Receipt();
        System.out.println(receipt.total());
    }
}

class Receipt {
    int total() {
        return 12;
    }
}`,
  },
];

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(baseUrl);
  const results = [];
  for (const probe of probes) {
    // Exercise the shipped browser worker without mocking the execution service.
    const result = await page.evaluate(({ probe, judgeUrl }) => new Promise(resolve => {
      const worker = new Worker("/runners/java.worker.js");
      const finish = result => {
        clearTimeout(timer);
        worker.terminate();
        resolve(result);
      };
      const timer = setTimeout(() => finish({ verdict: "time_limit", cases: [] }), 60000);
      worker.onmessage = event => finish(event.data);
      worker.onerror = event => finish({ verdict: "runtime_error", cases: [], compileError: { message: event.message } });
      worker.postMessage({
        code: probe.code,
        language: "java",
        mode: "program",
        functionName: "main",
        stdin: probe.stdin,
        cases: [{ id: "probe", input: [], expected: probe.expected }],
        timeLimitMs: 2000,
        judgeUrl,
      });
    }), { probe, judgeUrl });
    const passed = result.verdict === "accepted" && result.cases.length === 1 && result.cases.every(test => test.passed);
    results.push({ name: probe.name, stdin: probe.stdin, expected: probe.expected, passed, result });
    console.log(`${passed ? "PASS" : "FAIL"}: ${probe.name} — ${result.compileError?.message || result.verdict}`);
  }
  const report = {
    checkedAt: new Date().toISOString(),
    runtime: "shipped browser Java worker; no mocked endpoint",
    endpointConfigured: Boolean(judgeUrl),
    passed: results.every(result => result.passed),
    results,
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/foundations-java-gate.json", JSON.stringify(report, null, 2) + "\n");
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close();
}
