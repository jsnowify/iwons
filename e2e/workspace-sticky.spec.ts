import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 600 },
]) {
  test(`editor stays visible beside a scrolling question at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/problems/receipt-arithmetic-proof-strip/");
    await expect(page.locator(".monaco-editor")).toBeVisible();
    const editor = page.getByRole("region", { name: "Code workspace", exact: true });
    const description = page.locator(".description-content");

    for (const theme of ["light", "dark"]) {
      if (await page.locator("html").getAttribute("data-theme") !== theme) {
        await page.getByRole("button", { name: /Switch to .* theme/ }).click();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const initialQuestionTop = (await description.boundingBox())!.y;
      // Scroll over the question, just as a reader would, rather than scrolling Monaco.
      await description.hover({ position: { x: 30, y: 100 } });
      await page.mouse.wheel(0, 400);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
      await expect.poll(() => editor.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(12);
      expect((await description.boundingBox())!.y).toBeLessThan(initialQuestionTop - 300);
      const bounds = (await editor.boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 11);
      await expect(editor.locator(".editor-bar")).toBeInViewport({ ratio: 1 });
      await expect(editor.getByRole("region", { name: "Execution results", exact: true })).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const input = editor.locator(".monaco-editor textarea");
      await input.focus();
      await expect(input).toBeFocused();
      await page.screenshot({ path: `artifacts/workspace-sticky-${viewport.width}-${theme}.png` });

      // The pinned panel must release at the end of the question, before the footer.
      await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
      const bottom = await page.evaluate(() => ({
        editor: document.querySelector(".editor-pane")!.getBoundingClientRect().bottom,
        footer: document.querySelector("footer")!.getBoundingClientRect().top,
      }));
      expect(bottom.editor).toBeLessThanOrEqual(bottom.footer);
    }
    await page.getByRole("button", { name: "Toggle focus mode", exact: true }).click();
    expect(await editor.evaluate(el => getComputedStyle(el).position)).toBe("relative");
    await expect(page.locator(".monaco-editor")).toBeInViewport();
    await page.getByRole("button", { name: "Toggle focus mode", exact: true }).click();
    expect(errors).toEqual([]);
  });
}

test("mobile keeps the question and editor in separate tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/problems/receipt-arithmetic-proof-strip/");
  const editor = page.getByRole("region", { name: "Code workspace", exact: true });
  await expect(editor).toBeHidden();
  await page.getByRole("button", { name: "Code & results", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  expect(await editor.evaluate(el => getComputedStyle(el).position)).toBe("relative");
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expect(page.getByRole("contentinfo")).toBeInViewport({ ratio: 0.99 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
