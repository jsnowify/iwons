import { test, expect, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";

test.use({ serviceWorkers: "block" });
let address = 200;
const password = "blue river morning";
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${++address}` }); });
async function signup(page: Page) {
  const username = `limit_${randomBytes(3).toString("hex")}`;
  await page.goto("/signup/");
  const form = page.getByRole("form", { name: "Create account", exact: true });
  await form.getByLabel("Username", { exact: true }).fill(username);
  await form.getByLabel("Email", { exact: true }).fill(`${username}@example.org`);
  await form.getByLabel("Display name", { exact: false }).fill("Limit Tester");
  await form.getByLabel("Password", { exact: true }).fill(password);
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator(".account-trigger")).toBeVisible({ timeout: 30_000 });
}
/** Sends `count` same-origin requests and reports the statuses and the first Retry-After seen. */
async function burst(page: Page, path: string, count: number, method = "GET") {
  return page.evaluate(async ({ path, count, method }) => {
    const statuses: number[] = []; let retryAfter: string | null = null, error = "";
    for (let i = 0; i < count; i++) {
      const response = await fetch(path, { method, credentials: "same-origin" });
      statuses.push(response.status);
      if (response.status === 429 && !retryAfter) { retryAfter = response.headers.get("Retry-After"); error = ((await response.json()) as { error: string }).error; }
    }
    return { statuses, retryAfter, error };
  }, { path, count, method });
}

test("room search, the public leaderboard and exports answer 429 with Retry-After once a budget is used", async ({ page }) => {
  await signup(page);
  const search = await burst(page, "/api/rooms/catalog/?q=&limit=1", 34);
  expect(search.statuses.slice(0, 30).every(status => status === 200)).toBe(true);
  expect(search.statuses.slice(30).every(status => status === 429)).toBe(true);
  expect(Number(search.retryAfter)).toBeGreaterThan(0);
  expect(Number(search.retryAfter)).toBeLessThanOrEqual(60);
  expect(search.error).toMatch(/too many requests/i);
  const exported = await burst(page, "/api/me/export/", 5);
  expect(exported.statuses.filter(status => status === 429).length).toBeGreaterThanOrEqual(2);
  const board = await burst(page, "/api/leaderboard/?scope=global&limit=1", 123);
  expect(board.statuses.slice(0, 120).every(status => status === 200)).toBe(true);
  expect(board.statuses.slice(120).every(status => status === 429)).toBe(true);
});
