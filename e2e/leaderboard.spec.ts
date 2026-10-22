import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
test("global and language rankings remain optional and keyboard accessible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route("**/api/leaderboard/**", route => {
    const language = new URL(route.request().url()).searchParams.get("language");
    return route.fulfill({ json: { rows: language === "python" ? [] : [{ rank: 1, handle: "learner_one", avatar: "L", solved: 12, points: 20 }], nextCursor: null, own: null } });
  });
  await page.goto("/leaderboard/");
  await expect(page.getByText("learner_one", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join the leaderboard (optional)" })).toBeVisible();
  await page.getByRole("tab", { name: "Global", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Java", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Java rankings" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("No one here yet.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [390, 1440]) test(`Leaderboards is reachable and active in navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 950 });
  await page.route("**/api/leaderboard/**", route => route.fulfill({ json: { rows: [], own: null, nextCursor: null } }));
  await page.goto("/dashboard/");
  if (width < 768) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const nav = page.getByRole("navigation", { name: width < 768 ? "All pages" : "Main navigation", exact: true });
  await nav.getByRole("link", { name: "Leaderboards", exact: true }).click();
  await expect(page).toHaveURL(/\/leaderboard\/$/);
  if (width < 768) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(nav.getByRole("link", { name: "Leaderboards", exact: true })).toHaveAttribute("aria-current", "page");
});
