import { test, expect } from "@playwright/test";

for (const width of [360, 768, 1024, 1280]) for (const theme of ["light", "dark"]) {
test(`pattern strength disclosure, ${width}px ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await page.goto("/progress/");
  const patterns = page.getByRole("region", { name: "Pattern strength", exact: true });
  const toggle = patterns.getByRole("button", { name: "Expand", exact: true });
  await expect(patterns.getByRole("progressbar")).toHaveCount(5);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  if(await page.locator(".progress-details").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length===2)){
    const geometry=await page.locator('.progress-details').evaluate(el=>{const cards=[...el.querySelectorAll(':scope > .card:not(.fullspan), :scope > .stack > .card')].map(card=>card.getBoundingClientRect());return cards.map(({top,bottom})=>({top,bottom}));});
    expect(Math.abs(geometry[0].bottom-geometry[1].bottom)).toBeLessThan(2);
    expect(Math.abs(geometry[2].bottom-geometry[3].bottom)).toBeLessThan(2);
  }
  if (await page.locator("html").getAttribute("data-theme") !== theme) {
    await page.getByRole("button", { name: `Switch to ${theme} theme`, exact: true }).click();
  }
  await patterns.screenshot({ path: `artifacts/pattern-strength-${width}-${theme}.png` });
  await toggle.focus();
  await page.keyboard.press("Enter");
  const collapse = patterns.getByRole("button", { name: "Collapse", exact: true });
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  expect(await patterns.getByRole("progressbar").count()).toBeGreaterThan(5);
  await page.keyboard.press("Space");
  await expect(patterns.getByRole("progressbar")).toHaveCount(5);
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
}
