import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const width of [320, 390, 1024, 1440, 1536, 1920]) {
  test(`visualizer controls align at ${width}px in the completion state`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto('/visualizer/bubble-sort/');
    await expect(page.locator('.engine-svg-stage')).toBeVisible();
    const inputToggle = page.getByRole('button', { name: 'Toggle input panel' });
    if (width < 1024) await inputToggle.click();
    const preset = page.getByRole('combobox', { name: 'Preset', exact: true });
    await preset.selectOption('reversed');
    await page.getByRole('heading', { level: 1 }).click();
    await page.keyboard.press('End');
    await expect(page.locator('.stage-completion-banner')).toBeVisible();
    const dock = page.locator('.visualizer-control-dock');
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) {
        await page.getByRole('button', { name: /^Switch (to .* )?theme$/ }).click();
      }
      await dock.scrollIntoViewIfNeeded();
      const sizes = await dock.locator('button:visible, select:visible, input[type="text"]:visible').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(sizes.every(height => Math.abs(height - 44) <= 1), `Control heights: ${sizes}`).toBe(true);
      const input = (await page.getByRole('textbox', { name: 'Custom input' }).boundingBox())!;
      const apply = (await page.getByRole('button', { name: 'Apply', exact: true }).boundingBox())!;
      expect(Math.abs(input.y - apply.y)).toBeLessThanOrEqual(1);
      if (width >= 1440) {
        const presetBox = (await preset.boundingBox())!;
        const random = (await page.getByRole('button', { name: 'Randomize', exact: true }).boundingBox())!;
        expect(Math.abs(presetBox.y - input.y)).toBeLessThanOrEqual(1);
        expect(Math.abs(random.y - input.y)).toBeLessThanOrEqual(1);
        const speed = (await page.getByRole('combobox', { name: 'Speed', exact: true }).boundingBox())!;
        const play = (await page.getByRole('button', { name: 'Play animation', exact: true }).boundingBox())!;
        expect(Math.abs(speed.y - play.y)).toBeLessThanOrEqual(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await dock.screenshot({ path: `artifacts/visualizer-controls-${width}-${theme}.png` });
      const predict = page.getByRole('switch', { name: 'Predict step', exact: true });
      await predict.focus();
      await page.keyboard.press('Space');
      await expect(predict).toBeChecked();
      await expect(dock.locator('.predict-state')).toHaveText('On');
      await dock.screenshot({ path: `artifacts/visualizer-controls-${width}-${theme}-predict-on.png` });
      await page.keyboard.press('Space');
      await expect(predict).not.toBeChecked();
    }
  });
}
