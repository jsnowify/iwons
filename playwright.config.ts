import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: false,
  // These flows assert real worker deadlines; concurrent browser suites can
  // consume that budget before a worker gets CPU time on the shared machine.
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1440, height: 1080 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node --conditions=react-server --import tsx scripts/test-server.ts",
    env: { PORT: "4173", AUTH_TRUST_HOST: "true", AUTH_URL: "http://127.0.0.1:4173", TRUSTED_IP_HEADER: "x-forwarded-for" },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
