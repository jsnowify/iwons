import { test, expect } from "@playwright/test";

test("the margin-stop key stays on the frame and works with keyboard focus", async ({ page }) => {
  await page.goto("/dashboard/");
  const sidebar = page.getByRole("complementary", { name: "Workspace", exact: true });
  const toggle = sidebar.locator("button.sidebar-toggle");
  await expect(toggle).toHaveAccessibleName("Collapse sidebar");
  await toggle.focus();
  await expect(sidebar.getByRole("tooltip", { name: "Collapse sidebar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sidebar.getByRole("tooltip", { name: "Collapse sidebar" })).toBeHidden();
  const before = await toggle.boundingBox();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAccessibleName("Expand sidebar");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => Math.round((await sidebar.boundingBox())!.width)).toBe(80);
  const after = (await toggle.boundingBox())!;
  const frame = (await sidebar.boundingBox())!;
  expect(after.width).toBeGreaterThanOrEqual(44);
  expect(after.height).toBeGreaterThanOrEqual(44);
  expect(after.y).toBe(before!.y);
  expect(Math.abs(after.x + after.width / 2 - (frame.x + frame.width - 1))).toBeLessThanOrEqual(1);
  const controls = await toggle.getAttribute("aria-controls");
  expect(await page.locator("[id]").evaluateAll((elements, id) => elements.some(element => element.id === id), controls)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await sidebar.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
});

test("the mobile drawer keeps its close button and has no visible edge tab", async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 900 });
  await page.goto("/dashboard/");
  await expect(page.getByRole("button", { name: "Collapse sidebar", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /close/i })).toBeVisible();
  await dialog.getByRole("button", { name: /close/i }).click();
  await expect(dialog).toBeHidden();
});
