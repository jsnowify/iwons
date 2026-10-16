import { readFileSync } from "node:fs";
import type { LearnManifest } from "../src/lib/foundations/model-v2";
const manifest=JSON.parse(readFileSync("src/data/foundations.json","utf8")) as LearnManifest;
import { test, expect } from "@playwright/test";
test.use({serviceWorkers:"block"});

test("course names and metadata use full names and legacy URLs redirect", async ({ page, request }) => {
  const old = await request.get("/learn/python/cp1/meet-the-language/", { maxRedirects: 0 });
  expect(old.status()).toBe(308);
  expect(old.headers().location).toBe("/learn/python/computer-programming-1/meet-the-language/");
  for (const width of [360,768,1280]) {
    await page.setViewportSize({ width,height:900 });
    await page.goto("/learn/python/computer-programming-1/");
    const visible = await page.locator("body").innerText();
    expect(visible).not.toMatch(/\b(?:CP1|CP2|DSA)\b/);
    expect(await page.title()).toContain("Computer Programming 1 in Python");
    expect(await page.title()).not.toMatch(/\b(?:CP1|CP2|DSA)\b/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  const planned=manifest.courses[0].modules.find(entry=>entry.status!=="ready");
  if(planned){await page.goto(`/learn/python/computer-programming-1/${planned.slug}/`);await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);}
  const sitemap=await (await request.get("/sitemap.xml")).text();
  if(planned)expect(sitemap).not.toContain(`/${planned.slug}/`);
  expect(sitemap).toContain("/meet-the-language/");
  expect(sitemap).not.toMatch(/\/learn\/(?:java|python|javascript|typescript)\/(?:cp1|cp2|dsa)\//);
});
