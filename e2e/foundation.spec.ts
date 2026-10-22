import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { FoundationTopic } from "../src/lib/topic-foundations";

async function writeCode(page: Page, code: string) {
  await page.locator(".monaco-editor").waitFor();
  // Use Monaco's model API, as in the existing workspace browser suite.
  await page.evaluate(value => new Promise<void>(resolve => {
    const amd = (window as unknown as { require: (names: string[], callback: (m: { editor: { getModels: () => { setValue: (v: string) => void }[] } }) => void) => void }).require;
    amd(["vs/editor/editor.main"], monaco => { monaco.editor.getModels()[0].setValue(value); resolve(); });
  }), code);
}

test("foundation feedback, hints, drafts, recall, and topic-specific unlocking survive reload", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/path/0/");
  await page.locator(".path-chapter > .primer").screenshot({ path: "artifacts/chapter-intro-wide.png" });
  const unit = page.locator("#receipt-arithmetic");
  await expect(unit.getByRole("link", { name: /proof strip/i })).toHaveCount(0);
  await unit.getByRole("button", { name: "Start or resume foundation" }).click();
  await expect(unit.getByText("Step 1 of 6", { exact: false })).toBeVisible();
  await unit.locator(".monaco-editor").waitFor();
  await unit.getByRole("button", { name: "Run and check" }).click();
  await expect(unit.getByRole("status").first()).toContainText("Replace the ___ blank");
  await unit.getByRole("button", { name: "Hint 1 of 3" }).click();
  await writeCode(page, "function practice() { return 2 + 4; }");
  await page.reload();
  await unit.getByRole("button", { name: "Start or resume foundation" }).click();
  await expect(unit.getByRole("button", { name: "Hint 2 of 3" })).toBeVisible();
  await expect(unit.locator(".monaco-editor")).toContainText("return 2 + 4");
  const topic = JSON.parse(await readFile("public/foundation-data/receipt-arithmetic.json", "utf8")) as FoundationTopic;
  for (const [index, step] of topic.foundation.steps.entries()) {
    if (index > 0) await unit.getByRole("button", { name: "Next step", exact: true }).click();
    const code = index === 0 ? "function practice() { return 2 + 4; }" : index === 1 ? "function practice() { const x = 5; return 2 * x + 3; }" : step.exampleCode;
    await writeCode(page, code);
    if (step.recall) {
      await unit.getByRole("button", { name: "Run and check" }).click();
      await expect(unit.getByRole("status").first()).toContainText("Try the recall question");
      await unit.getByRole("textbox", { name: "Recall answer" }).fill(step.recall.answer);
    }
    await unit.getByRole("button", { name: "Run and check" }).click();
    await expect(unit.getByRole("status").first()).toContainText("Nice, you worked");
    if (index === 1) await unit.locator("article").screenshot({ path: "artifacts/foundation-desktop.png" });
  }
  await expect(unit.getByRole("heading", { name: "Foundation Lesson — Complete ✓" })).toBeVisible();
  await expect(unit.getByRole("link", { name: /proof strip/i })).toHaveCount(1);
  await expect(page.locator("#stamp-gates").getByRole("link")).toHaveCount(0);
  await page.reload();
  await unit.getByRole("link", { name: /proof strip/i }).click();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
});

test("direct challenge URLs respect the foundation gate, including free browse", async ({ page }) => {
  await page.goto("/problems/receipt-arithmetic-proof-strip/");
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(page.locator(".gate-banner")).toContainText("Foundation Lesson");
  await page.goto("/settings/");
  await page.getByRole("switch", { name: /Free browse/ }).check();
  await page.goto("/problems/receipt-arithmetic-proof-strip/");
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
});

test("mobile foundation keeps controls usable in both themes with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/path/0/");
  const unit = page.locator("#receipt-arithmetic");
  await unit.getByRole("button", { name: "Start or resume foundation" }).click();
  await expect(unit.locator(".monaco-editor")).toBeVisible();
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: /^Switch .*theme$/ }).click();
    await expect(unit.getByRole("button", { name: "Run and check" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await unit.screenshot({ path: "artifacts/foundation-mobile.png" });
});

test("lesson loading retries after a failed request and keeps answers out of initial HTML", async ({ page, request }) => {
  const html = await (await request.get("/path/0/")).text();
  expect(html).not.toContain("function practice(");
  let attempts = 0;
  await page.route("**/foundation-data/stamp-gates.json", async route => {
    attempts++;
    if (attempts === 1) await route.abort();
    else await route.continue();
  });
  await page.goto("/path/0/");
  const unit = page.locator("#stamp-gates");
  await unit.getByRole("button", { name: "Start or resume foundation" }).click();
  await expect(unit.getByRole("alert")).toContainText("could not load");
  await unit.getByRole("button", { name: "Start or resume foundation" }).click();
  await expect(unit.getByText("Step 1 of 6", { exact: false })).toBeVisible();
});
