import { test, expect, type Page } from "@playwright/test";
import { mergeProgress, type AccountProgress, type ProgressPatch } from "../src/lib/accounts/contracts";
import { writeCode } from "./editor-fixture";
test.use({ serviceWorkers: "block" });
async function accountFixture(page: Page, remote?: { data: AccountProgress }) {
  let signedIn = true, imports = 0, failSync = false;
  const data: AccountProgress = { drafts: { sample_java: { code: "remote draft", updatedAt: 10 } },
    preferences: { readableText: { value: false, updatedAt: 10 } }, foundationProgress: {}, unverifiedSolves: [], updatedAt: 10 };
  const shared = remote ?? { data };
  await page.addInitScript(() => {
    if (localStorage.getItem("guest-fixture")) return;
    localStorage.setItem("guest-fixture", "ready");
    localStorage.setItem("iwons:v6:schemaVersion", "6");
    localStorage.setItem("iwons:v6:profile", JSON.stringify({ name: "Guest learner", avatar: "G", onboarded: true }));
    localStorage.setItem("iwons:v6:drafts:guest:java", JSON.stringify("guest draft"));
    localStorage.setItem("iwons:v6:progress", JSON.stringify({ guest: true }));
  });
  await page.route("**/api/me/", route => route.fulfill({ json: { user: signedIn ? { id: "account-test", name: "Account learner", avatar: "A", handle: null, leaderboardOptIn: false } : null, providers: ["github"] } }));
  await page.route("**/api/me/submissions/", route => route.fulfill({ json: [] }));
  await page.route("**/api/me/progress/", async route => {
    if (route.request().method() === "PUT") {
      if (failSync) return route.fulfill({ status: 503, json: { error: "Offline test: changes saved locally." } });
      shared.data = mergeProgress(shared.data, route.request().postDataJSON() as ProgressPatch);
    }
    return route.fulfill({ json: shared.data });
  });
  await page.route("**/api/sync/import/", async route => {
    imports++; const body = route.request().postDataJSON(); expect(body.version).toBe(1); expect(body.sourceSchemaVersion).toBe(6);
    shared.data = mergeProgress(shared.data, body.data); return route.fulfill({ json: shared.data });
  });
  await page.route("**/api/auth/csrf", route => route.fulfill({ json: { csrfToken: "test-csrf" } }));
  await page.route("**/api/auth/signout", async route => { signedIn = false; return route.fulfill({ json: { url: "http://127.0.0.1:4173/settings/" } }); });
  return { imports: () => imports, server: () => shared.data, shared, setOffline: (value: boolean) => { failSync = value; } };
}
test("account import is optional, explicit, remembered and preserves guest data through logout", async ({ page }) => {
  const state = await accountFixture(page);
  await page.goto("/settings/");
  const notice = page.getByRole("region", { name: "Optional device import" });
  await expect(notice).toBeVisible(); expect(state.imports()).toBe(0);
  await page.getByRole("button", { name: "Import device progress", exact: true }).click();
  await expect(notice).toHaveCount(0); expect(state.imports()).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("iwons:v6:drafts:guest:java"))).toBe(JSON.stringify("guest draft"));
  const readable = page.getByRole("switch", { name: /Readable text/ });
  await readable.check();
  await expect.poll(() => state.server().preferences.readableText?.value).toBe(true);
  await page.reload();
  await expect(readable).toBeChecked(); await expect(notice).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:progress")!))).toEqual({ guest: true });
  expect(await page.evaluate(() => localStorage.getItem("iwons:v6:drafts:guest:java"))).toBe(JSON.stringify("guest draft"));
});
test("skipped imports stay skipped and queued preferences survive an offline reload", async ({ page }) => {
  const state = await accountFixture(page); await page.goto("/settings/");
  await page.getByRole("button", { name: "Skip import", exact: true }).click();
  state.setOffline(true);
  await page.getByRole("switch", { name: /Readable text/ }).check();
  await expect(page.getByRole("region", { name: "Optional account" }).getByRole("alert")).toContainText("Offline test");
  state.setOffline(false); await page.reload();
  await expect(page.getByRole("switch", { name: /Readable text/ })).toBeChecked();
  await expect.poll(() => state.server().preferences.readableText?.value).toBe(true);
  expect(state.imports()).toBe(0);
  await expect(page.getByRole("region", { name: "Optional device import" })).toHaveCount(0);
});
test("account APIs reject anonymous access without blocking guest pages", async ({ request }) => {
  for (const path of ["/api/me/progress/", "/api/me/submissions/", "/api/me/export/"])
    expect((await request.get(path)).status()).toBe(401);
  const response = await request.post("/api/sync/import/", { headers: { Origin: "http://127.0.0.1:4173" }, data: { version: 1 } });
  expect(response.status()).toBe(401);
  expect((await request.get("/path/")).ok()).toBe(true);
});

test("account preferences sync between isolated device caches without importing guest data", async ({ page, browser }) => {
  const first = await accountFixture(page);
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Skip import", exact: true }).click();
  await page.getByRole("switch", { name: /Readable text/ }).check();
  await expect.poll(() => first.server().preferences.readableText?.value).toBe(true);
  const otherContext = await browser.newContext({ serviceWorkers: "block" });
  try {
    const second = await otherContext.newPage();
    const other = await accountFixture(second, first.shared);
    await second.goto("http://127.0.0.1:4173/settings/");
    await expect(second.getByRole("switch", { name: /Readable text/ })).toBeChecked();
    await second.getByRole("button", { name: "Skip import", exact: true }).click();
    await second.getByRole("switch", { name: /Readable text/ }).uncheck();
    await expect.poll(() => first.server().preferences.readableText?.value).toBe(false);
    await page.reload();
    await expect(page.getByRole("switch", { name: /Readable text/ })).not.toBeChecked();
    expect(first.imports()).toBe(0); expect(other.imports()).toBe(0);
    for (const device of [page, second])
      expect(await device.evaluate(() => localStorage.getItem("iwons:v6:drafts:guest:java"))).toBe(JSON.stringify("guest draft"));
  } finally { await otherContext.close(); }
});

test("optional Foundation drafts and completion sync to a separate account device cache", async ({ page, browser }) => {
  const first = await accountFixture(page);
  await page.goto("/foundation/variables-constants/");
  await page.getByRole("button", { name: "Skip import", exact: true }).click();
  await writeCode(page, "const score = 12;\nconsole.log(score);");
  await page.getByRole("button", { name: "Run and check" }).click();
  await expect(page.locator(".foundation-feedback")).toContainText("Lesson done");
  await expect.poll(() => first.server().foundationProgress["foundation-track-v1"]?.steps["variables-constants"]?.completed).toBe(true);
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    const second = await context.newPage();
    await accountFixture(second, first.shared);
    await second.goto("http://127.0.0.1:4173/foundation/");
    await expect(second.locator('a[href="/foundation/variables-constants/"]')).toContainText("Done");
    await second.goto("http://127.0.0.1:4173/foundation/variables-constants/");
    await expect(second.locator(".monaco-editor")).toContainText("score = 12");
    await expect(second.getByText("Done. You can keep experimenting", { exact: false })).toBeVisible();
    expect(await second.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:topicFoundations") ?? "{}"))).toEqual({});
    expect(first.server().unverifiedSolves).toEqual([]);
  } finally { await context.close(); }
});

test("handle availability is debounced, cancels stale hints and survives a save race or rate limit", async ({ page }) => {
  await accountFixture(page);
  await page.route("**/api/handle/available/**", route => {
    const handle = new URL(route.request().url()).searchParams.get("handle");
    return handle === "limited_handle" ? route.fulfill({ status: 429, json: { error: "Too many requests" } })
      : route.fulfill({ json: handle === "taken_handle" ? { available: false, reason: "taken" } : { available: true } });
  });
  await page.route("**/api/me/", route => route.request().method() === "PATCH"
    ? route.fulfill({ status: 409, json: { error: "That handle is already taken." } })
    : route.fulfill({ json: { user: { id: "account-test", name: "Account learner", avatar: "A", handle: null, leaderboardOptIn: false }, providers: ["github"] } }));
  await page.goto("/settings/"); await page.getByRole("button", { name: "Skip import", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Handle", exact: true });
  await input.fill("taken_handle"); await expect(page.getByText("Already taken. Try another handle.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save handle", exact: true })).toBeDisabled();
  await input.fill("free_handle"); await expect(page.getByText("Available", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save handle", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "That handle is already taken." })).toBeVisible();
  await input.fill("limited_handle");
  await expect(page.getByText("Availability will be checked when you save.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save handle", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: /^Use / })).toBeVisible();
});

test("import preview excludes custom solves and drafts using the catalog policy", async ({ page }) => {
  await accountFixture(page);
  await page.addInitScript(() => {
    localStorage.removeItem("iwons:v6:drafts:guest:java");
    localStorage.setItem("iwons:v6:progress", JSON.stringify({ "path3-001": true, "custom-problem": true }));
    localStorage.setItem("iwons:v6:drafts:path3-001:java", JSON.stringify("catalog draft"));
    localStorage.setItem("iwons:v6:drafts:custom-problem:java", JSON.stringify("custom draft"));
  });
  await page.goto("/settings/");
  const preview = page.getByRole("region", { name: "Optional device import" });
  await expect(preview).toContainText("1 solved problem, 1 draft");
  await expect(preview).toContainText("2 items won’t be imported (custom problems).");
  await page.getByRole("button", { name: "Import device progress", exact: true }).click();
  await expect(preview).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("iwons:v6:drafts:custom-problem:java"))).toBe(JSON.stringify("custom draft"));
});

test("imported verification pauses, survives reload and resumes normal Submit jobs", async ({ page }) => {
  await accountFixture(page); let finish = false, sent = 0, canceled = 0;
  await page.route("**/api/me/verification/", route => route.fulfill({ json: { concurrency: 3, items: [
    { problemId: "server-add-two-numbers", title: "Add Two Numbers", reason: "ready", language: "java", code: "public class Main {}" },
    { problemId: "another-import", title: "Another import", reason: "ready", language: "python", code: "print(5)" },
    { problemId: "missing-import", title: "Missing code", reason: "missing_code" },
    { problemId: "legacy-import", title: "Legacy code", reason: "unsupported" },
  ] } }));
  await page.route("**/api/judge/", route => {
    expect(route.request().postDataJSON().mode).toBe("submit"); sent++;
    return route.fulfill({ status: 202, json: { jobId: sent.toString(16).padStart(64, "0") } });
  });
  await page.route("**/api/judge/*/cancel/", route => { canceled++; return route.fulfill({ json: { state: "canceled", alreadyFinished: false } }); });
  await page.route(/\/api\/judge\/[a-f0-9]{64}\/$/, route => route.fulfill({ json: finish ? { state: "done", result: {
    verdict: "accepted", failureSource: "user", passed: 5, total: 5, runtimeMs: 10, memoryKb: 1024,
    message: "Passed", cases: [], hiddenCases: [1, 2, 3].map(index => ({ index, status: "passed" })),
  } } : { state: "running", done: 1, total: 5 } }));
  await page.goto("/progress/");
  const panel = page.getByRole("region", { name: "Imported solve verification" });
  await expect(panel).toContainText("1 solve has no imported code");
  await expect(panel).toContainText("1 problem isn’t available for server verification yet");
  await panel.getByRole("button", { name: "Verify my imported solves", exact: true }).click();
  await expect.poll(() => sent).toBe(2);
  await panel.getByRole("button", { name: "Pause verification", exact: true }).click();
  await expect.poll(() => canceled).toBe(2);
  await expect(panel.getByRole("button", { name: "Resume verification", exact: true })).toBeEnabled();
  await page.reload(); finish = true;
  await panel.getByRole("button", { name: "Resume verification", exact: true }).click();
  await expect(panel).toContainText("2 of 2 checked.");
  await expect(panel.getByText("Verified", { exact: true })).toHaveCount(2);
  expect(sent).toBe(4);
  expect(await page.evaluate(() => localStorage.getItem("iwons:v6:drafts:guest:java"))).toBe(JSON.stringify("guest draft"));
});

test("verification respects Retry-After and keeps unsuccessful imports as personal progress", async ({ page }) => {
  await accountFixture(page); let sent = 0;
  await page.route("**/api/me/verification/", route => route.fulfill({ json: { concurrency: 1, items: [
    { problemId: "server-add-two-numbers", title: "Add Two Numbers", reason: "ready", language: "java", code: "public class Main {}" },
  ] } }));
  await page.route("**/api/judge/", route => {
    sent++; return sent === 1 ? route.fulfill({ status: 429, headers: { "Retry-After": "1" }, json: { error: "Wait" } })
      : route.fulfill({ status: 202, json: { jobId: "f".repeat(64) } });
  });
  await page.route(/\/api\/judge\/[a-f0-9]{64}\/$/, route => route.fulfill({ json: { state: "done", result: {
    verdict: "wrong_answer", failureSource: "user", passed: 0, total: 5, runtimeMs: 10, memoryKb: 1024,
    message: "Check your output", cases: [],
  } } }));
  await page.goto("/progress/"); const panel = page.getByRole("region", { name: "Imported solve verification" });
  await panel.getByRole("button", { name: "Verify my imported solves", exact: true }).click();
  await expect(panel).toContainText("Waiting for the submit limit.");
  await expect(panel).toContainText("Couldn’t verify this one yet; your code may need a small update.");
  expect(sent).toBe(2);
});
