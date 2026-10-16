import { test, expect } from "@playwright/test";
for (const width of [360, 768, 1280]) for (const theme of ["light", "dark"]) {
  test(`centered dialog and keyboard focus, ${width}px ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/design/");
    await page.waitForFunction(() => document.documentElement.dataset.theme);
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: "Switch theme", exact: true }).click();
    const trigger = page.getByRole("button", { name: "Open dialog", exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "A focused dialog" });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(250);
    const box = await dialog.locator(".modal-panel").boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(2);
    expect(Math.abs(box!.y + box!.height / 2 - 450)).toBeLessThan(2);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({ path: `artifacts/final-dialog-${width}-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    if (width >= 768) {
      const sidebar = page.getByRole("complementary", { name: "Workspace", exact: true });
      const labels = await sidebar.locator(".nav-link").evaluateAll(elements => elements.map(el => ({ font: parseFloat(getComputedStyle(el).fontSize), height: el.getBoundingClientRect().height })));
      expect(labels.every(x => x.font >= 14 && x.height >= 44)).toBe(true);
      await page.getByRole("button", { name: "Collapse sidebar", exact: true }).first().click();
      const desk = sidebar.getByRole("link", { name: "Your desk", exact: true });
      await desk.focus();
      await expect(page.getByRole("tooltip", {name:"Your desk", exact:true})).toBeVisible();
      await page.getByRole("button", { name: "Expand sidebar", exact: true }).first().click();
      await page.setViewportSize({ width, height: 450 });
      const profile = sidebar.getByRole("link").last();
      await profile.scrollIntoViewIfNeeded();
      await expect(profile).toBeInViewport();
    } else {
      const menu = page.getByRole("button", { name: "Open navigation", exact: true });
      await menu.click();
      const navigation = page.getByRole("dialog", { name: "Your workspace" });
      await expect(navigation.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
      await menu.click();
      await navigation.getByRole("link", { name: "Settings", exact: true }).click();
      await expect(page).toHaveURL(/\/settings\/$/);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await expect(page.locator(".brand-dot").first()).toHaveCSS("animation-name", "none");
  });
}
