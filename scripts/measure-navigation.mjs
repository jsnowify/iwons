import { chromium } from '@playwright/test';
import fs from 'node:fs';

// Run against an already completed production export served on port 4174.
// Keep the same browser/network settings and three-second reading interval for both runs.
const phase = process.env.PHASE || 'before';
if (!['before', 'after'].includes(phase)) throw new Error('PHASE must be before or after');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
  });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const rows = [];
  await page.goto('http://127.0.0.1:4174/');
  await page.waitForFunction(() => document.documentElement.dataset.motion);
  for (const href of ['/path/', '/problems/', '/progress/', '/settings/']) {
    await page.waitForTimeout(3000);
    const start = Date.now();
    await page.locator(`a[href="${href}"]:visible`).first().click();
    await page.waitForURL(`**${href}`);
    await page.locator('main h1').first().waitFor();
    rows.push({ href, ms: Date.now() - start });
    console.log(rows.at(-1));
  }
  fs.writeFileSync(`artifacts/performance/navigation-${phase}.json`, JSON.stringify({ latency: 150, download: 200000, cpu: 4, rows }, null, 2));
} finally {
  await browser.close();
}
