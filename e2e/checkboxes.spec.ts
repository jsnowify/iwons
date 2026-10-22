import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const width of [320, 1440]) {
  test(`shared checkboxes and switches retain native interaction at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/design/');
    const specimens = page.getByRole('region', { name: 'Checkbox and switch specimens' });
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button', { name: 'Switch theme', exact: true }).last().click();
      const checkbox = specimens.getByRole('checkbox', { name: 'Unchecked example', exact: true });
      await checkbox.focus();
      await page.keyboard.press('Space');
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveCSS('appearance', 'none');
      await expect(specimens.getByRole('checkbox', { name: 'Disabled example', exact: true })).toBeDisabled();
      await expect(specimens.getByRole('checkbox', { name: 'Disabled checked example', exact: true })).toBeChecked();
      await expect(specimens.getByRole('checkbox', { name: 'Mixed selection example', exact: true })).toHaveJSProperty('indeterminate', true);
      const toggle = specimens.getByRole('switch', { name: 'Switch example', exact: true });
      await toggle.focus();
      await page.keyboard.press('Space');
      await expect(toggle).toBeChecked();
      await expect(toggle).toHaveCSS('width', '40px');
      await expect(toggle).toHaveCSS('height', '24px');
      await specimens.screenshot({ path: `artifacts/checkboxes-${width}-${theme}.png` });
      await checkbox.uncheck();
      await toggle.uncheck();
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(specimens.getByRole('checkbox', { name: 'Unchecked example', exact: true })).toHaveCSS('appearance', 'auto');
  });

  test(`settings and Path share styled switches and saved values at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/settings/');
    const readable = page.getByRole('switch', { name: /Readable text/ });
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('switch')).toHaveCount(4);
    for (const toggle of await page.getByRole('switch').all()) {
      await expect(toggle).toHaveCSS('appearance', 'none');
      await expect(toggle).toHaveCSS('width', '40px');
      await expect(toggle).toHaveCSS('height', '24px');
    }
    await readable.check();
    await page.reload();
    await expect(readable).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-readable', 'true');
    await page.goto('/path/');
    await expect(page.getByRole('switch', { name: /Free browse/ })).toHaveCount(0);
    await expect(page.locator('.path-station a.chapter-card')).toHaveCount(9);
  });
}
