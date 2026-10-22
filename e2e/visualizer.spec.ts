import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const algorithm of ['bubble-sort', 'binary-search', 'fibonacci-dp', 'bfs-graph', 'binary-tree-inorder', 'reverse-linked-list']) {
  test(`${algorithm} fills the stage and keeps accessibility descriptions out of the layout`, async ({ page }) => {
    await page.goto(`/visualizer/${algorithm}/`);
    const svg = page.locator('.engine-svg-stage');
    await expect(svg).toBeVisible();
    const canvas = (await page.locator('.stage-canvas-card').boundingBox())!;
    expect((await svg.boundingBox())!.width).toBeGreaterThan(canvas.width * 0.85);
    const summary = page.locator('#stage-text-summary');
    expect((await summary.boundingBox())!.width).toBeLessThanOrEqual(1);
    expect((await summary.boundingBox())!.height).toBeLessThanOrEqual(1);
    await expect(page.getByRole('slider', { name: 'Timeline step scrubber' })).toBeVisible();
    if (algorithm === 'bubble-sort') {
      const metrics = await page.locator('.counter-item').all();
      const first = (await metrics[0].boundingBox())!;
      const second = (await metrics[1].boundingBox())!;
      expect(second.x - (first.x + first.width)).toBeGreaterThanOrEqual(12);
    }
  });
}

for (const width of [390, 1024, 1440]) {
  test(`visualizer catalog and deep links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/visualizer/');

    // Heading and Catalog search are visible
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Algorithm Visualizer');
    const searchInput = page.getByPlaceholder(/Search by algorithm name/i);
    await expect(searchInput).toBeVisible();

    // Verify filter pills and cards
    const allCards = page.locator('.algo-card');
    await expect(allCards.first()).toBeVisible();
    const initialCount = await allCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(50);

    // Filter by search query
    await searchInput.fill('binary search');
    await expect(page.locator('.algo-card-title', { hasText: 'Binary Search' }).first()).toBeVisible();

    // Reset filters
    const resetBtn = page.getByRole('button', { name: /Reset Filters/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
    } else {
      await searchInput.fill('');
    }
    await expect(allCards).toHaveCount(initialCount);

    // Verify no horizontal overflow
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    // Verify theme toggle
    const themeBtn = page.getByRole('button', { name: /Switch to .* theme/ });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('interactive visualizer shell stepping, presets, keyboard shortcuts, and audio', async ({ page }) => {
  await page.addInitScript(() => {
    const tracked = window as typeof window & { tones: number; contexts: number };
    tracked.tones = 0;
    tracked.contexts = 0;
    const Original = window.AudioContext;
    if (Original) {
      window.AudioContext = class extends Original {
        constructor() {
          super();
          tracked.contexts++;
        }
        createOscillator() {
          tracked.tones++;
          return super.createOscillator();
        }
      };
    }
  });

  await page.goto('/visualizer/binary-search/');

  // Header and Stage
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Binary Search');
  const stage = page.getByRole('region', { name: 'Algorithm animation stage' });
  await expect(stage).toBeVisible();
  await expect(page.locator('.caption-badge')).toContainText('Step 1 of');

  // Step forward button
  const stepForwardBtn = page.getByRole('button', { name: 'Step forward', exact: true });
  await stepForwardBtn.click();
  await expect(page.locator('.caption-badge')).toContainText('Step 2 of');

  // Step back button
  const stepBackBtn = page.getByRole('button', { name: 'Step back', exact: true });
  await stepBackBtn.click();
  await expect(page.locator('.caption-badge')).toContainText('Step 1 of');

  // Keyboard navigation: ArrowRight to step forward
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.caption-badge')).toContainText('Step 2 of');

  // Keyboard navigation: R to reset
  await page.keyboard.press('r');
  await expect(page.locator('.caption-badge')).toContainText('Step 1 of');

  // Sound toggle
  const soundBtn = page.getByRole('button', { name: /audio/i });
  await expect(soundBtn).toBeVisible();
  await soundBtn.click();
  await expect(soundBtn).toHaveAttribute('aria-pressed', 'true');

  // Reduced motion test
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const playBtn = page.getByRole('button', { name: /Play/i });
  await expect(playBtn).toBeDisabled();
  expect(await stepForwardBtn.evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
});
