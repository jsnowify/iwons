import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Problem, TestCase } from "../src/lib/types";
const references: {slug:string; js:string; typescript:string; python:string; java:string; problem:Problem; cases:TestCase[]}[] = JSON.parse(readFileSync("scripts/references.json", "utf8"));
const first = references[0];
import { readFile } from "node:fs/promises";
async function editor(page: Page, code: string) {
  const openEditor = page.getByRole("button", {name:"Open code editor",exact:true});
  await page.locator(".monaco-editor").or(openEditor).first().waitFor();
  if(await openEditor.isVisible()) await openEditor.click();
  await page.locator(".monaco-editor").waitFor();
  await page.evaluate(async (value) => {
    await new Promise<void>((resolve, reject) => {
      const amd = (
        window as unknown as {
          require: (
            names: string[],
            callback: (m: {
              editor: { getModels: () => { setValue: (v: string) => void }[] };
            }) => void,
          ) => void;
        }
      ).require;
      amd(["vs/editor/editor.main"], (monaco) => {
        const model = monaco.editor.getModels()[0];
        if (!model) {
          reject(new Error("Missing editor model"));
          return;
        }
        model.setValue(value);
        resolve();
      });
    });
  }, code);
}
async function onboard(page: Page) {
  await page.goto("/dashboard/");
  await page.getByRole("button", { name: "Make it yours" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox").fill("Josh");
  await modal.getByRole("button", { name: "Continue" }).click();
  await modal.getByRole("button", { name: "Continue" }).click();
  await modal.getByRole("checkbox").check();
  await modal.getByRole("button", { name: "Let’s solve" }).click();
  await expect(modal).not.toBeVisible();
}
test("onboarding → solve → saved draft, notes, submissions, progress, review, and backup", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onboard(page);
  await page.goto("/problems/");
  await page
    .getByRole("textbox", { name: "Search problems" })
    .fill(first.problem.title);
  await expect(page.locator(".problem-row")).toHaveCount(1);
  await page.getByRole("link", { name: new RegExp("^" + first.problem.title) }).click();
  await editor(page, references[0].js);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /^Result/ }).click();
  await expect(page.locator(".verdict")).toContainText("Accepted");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "It works. Now, how well?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep practicing" }).click();
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Problem notes" })
    .fill("## Pattern\nNormalize the name before greeting.");
  await page.waitForTimeout(700);
  await page.reload();
  const openEditor = page.getByRole("button", {name:"Open code editor",exact:true});
  await page.locator(".monaco-editor").or(openEditor).first().waitFor();
  if(await openEditor.isVisible()) await openEditor.click();
  await page.locator(".monaco-editor").waitFor();
  await expect(page.locator(".view-lines")).toContainText("out");
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Problem notes" }),
  ).toContainText("Normalize");
  await page.goto("/submissions/");
  await expect(page.locator(".submission-row")).toHaveCount(1);
  await page.locator(".submission-row").click();
  await expect(page.locator(".code-view")).toContainText(first.problem.functionName);
  await expect(page.getByText("9/9 tests", { exact: false })).toBeVisible();
  await page.goto("/dashboard/");
  await expect(page.locator(".stat-card").first()).toContainText("1");
  await page.goto("/review/");
  await expect(page.getByText("All clear for now.")).toBeVisible();
  await page.goto("/warm-up/");
  await page.getByRole("button",{name:/Find today/}).click();
  await expect(page.getByRole("heading",{name:first.problem.title,exact:true})).toBeVisible();
  await page.getByRole("textbox",{name:"Your recall"}).fill("Trace each reading, transform it, and check an empty input.");
  await page.getByRole("button",{name:"Show approach",exact:true}).click();
  await expect(page.locator(".screen-note")).toContainText(first.problem.overview);
  await page.getByRole("button",{name:"Good",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Your warm-up is complete."})).toBeVisible();
  await page.goto("/progress/");
  await expect(page.getByText(/First solve.*Earned/)).toBeVisible();
  await expect(page.locator(".profile-text")).toContainText("125 XP");
  const flexDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Flex Card" }).click();
  const flex = await flexDownload;
  const png = await readFile((await flex.path())!);
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  await page.goto("/settings/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export everything" }).click();
  expect((await download).suggestedFilename()).toContain("Iwons-backup");
  expect(errors).toEqual([]);
});
test("wrong answers, syntax errors, infinite loops, TypeScript, and language drafts", async ({
  page,
}) => {
  await onboard(page);
  await page.goto(`/problems/${first.slug}/`);
  await editor(page, `function ${first.problem.functionName}() { return null; }`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /^Result/ }).click();
  await expect(page.locator(".verdict")).toContainText("Wrong Answer");
  await editor(page, `function ${first.problem.functionName}( {`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator(".verdict")).toContainText("Compile Error");
  await editor(page, `function ${first.problem.functionName}() { while (true) {} }`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator(".verdict")).toContainText("Time Limit Exceeded", {
    timeout: 10000,
  });
  await page
    .getByRole("combobox", { name: "Editor language" })
    .selectOption("typescript");
  await editor(page, references[0].js + "\nconst typed: number = 1;");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator(".verdict")).toContainText("Accepted");
  await page
    .getByRole("combobox", { name: "Editor language" })
    .selectOption("javascript");
  await expect(page.locator(".view-lines")).toContainText("while");
});
test("Python actually loads and executes in a browser worker", async ({
  page,
}) => {
  test.setTimeout(180000);
  await onboard(page);
  await page.goto(`/problems/${first.slug}/`);
  await page
    .getByRole("combobox", { name: "Editor language" })
    .selectOption("python");
  await editor(page, references[0].python);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByRole("button", { name: /^Result/ }).click();
  await expect(page.locator(".verdict")).toContainText("Accepted", {
    timeout: 120000,
  });
  await editor(page, `def ${first.problem.functionName}(:\n pass`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.locator(".verdict")).toContainText("Compile Error", {
    timeout: 90000,
  });
});
test("custom authoring and saving a list work without a backend", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/problems/new/");
  await page
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Sum the readings");
  await page
    .getByRole("textbox", { name: "Statement", exact: true })
    .fill("Return the sum of the readings.");
  await page
    .getByRole("button", { name: "Create problem", exact: true })
    .click();
  await editor(
    page,
    "function solve(nums) { return nums.reduce((a, b) => a+b, 0); }",
  );
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "It works. Now, how well?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep practicing" }).click();
  await page.goto("/lists/");
  await page.getByRole("button", { name: "Create your first list" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox", { name: "List name" }).fill("My foundation");
  await modal.getByRole("checkbox").first().check();
  await modal.getByRole("button", { name: "Save 1 problems" }).click();
  await expect(
    page.getByRole("heading", { name: "My foundation" }),
  ).toBeVisible();
});
test("responsive dark and light pages, SEO HTML, and offline refresh", async ({
  page,
  context,
  request,
}) => {
  const response = await request.get(`/problems/${first.slug}/`);
  const html = await response.text();
  expect(html).toContain("fresh proof strip");
  expect(html).not.toContain("hiddenCases");
  expect(html).not.toContain("JavaScript reference");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/robots.txt")).status()).toBe(200);
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Good ideas/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/dashboard-${width}.png`,
      fullPage: true,
    });
    await page.goto("/problems/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/problems/${first.slug}/`);
    if (width < 1024) {
      await page.getByRole("button", { name: "Code & results" }).click();
    }
    const openEditor = page.getByRole("button", {name:"Open code editor",exact:true});
  await page.locator(".monaco-editor").or(openEditor).first().waitFor();
  if(await openEditor.isVisible()) await openEditor.click();
  await page.locator(".monaco-editor").waitFor();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/workspace-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Night", exact: true }).click();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "artifacts/dashboard-light.png",
    fullPage: true,
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Good ideas/ })).toBeVisible();
  await context.setOffline(false);
});

test("Watch records visibility events, second tabs, and large editor pastes", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await onboard(page);
  await page.goto(`/problems/${first.slug}/`);
  await editor(page, references[0].js);
  await page.evaluate(() =>
    navigator.clipboard.writeText("\n// " + "x".repeat(300)),
  );
  await page.locator(".monaco-editor .view-lines").click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Control+V");
  await page.waitForTimeout(200);
  const other = await context.newPage();
  await other.goto("/about/");
  await other.bringToFront();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(5500);
  await page.bringToFront();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await other.close();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "It works. Now, how well?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep practicing" }).click();
  await page.goto("/submissions/");
  await page.locator(".submission-row").first().click();
  await expect(
    page.getByText("Pasted into editor", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Left the Iwons tab", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Another Iwons tab detected", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("This attempt qualifies as clean.", { exact: false }),
  ).toHaveCount(0);
});

test("backup import restores saved work and a due review can be rated", async ({
  page,
}) => {
  await onboard(page);
  await page.goto(`/problems/${first.slug}/`);
  await editor(page, references[0].js);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "It works. Now, how well?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep practicing" }).click();
  await page.goto("/settings/");
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export everything" }).click();
  const download = await waiting;
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  backup.data.srs[0].due = Date.now() - 1000;
  backup.data.notes = { [first.problem.id]: "Restored from a real backup." };
  await page.locator("input[type=file]").setInputFiles({
    name: "Iwons-test-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Replace with backup" }).click();
  await page.waitForLoadState("load");
  await page.goto("/review/");
  await expect(
    page.getByRole("heading", { name: first.problem.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show approach" }).click();
  await expect(page.getByText("Restored from a real backup.")).toBeVisible();
  await page.getByRole("button", { name: /^Easy/ }).click();
  await expect(page.getByText("All clear for now.")).toBeVisible();
});

test("fullscreen contest exits create a flagged submission", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/contest/");
  await page
    .getByRole("combobox", { name: "Problems", exact: true })
    .selectOption("1");
  await page.getByRole("button", { name: "Enter fullscreen & start" }).click();
  await page.waitForURL(/\/problems\/[a-z0-9-]+\/$/);
  const slug = new URL(page.url()).pathname.split("/")[2];
  const reference = references.find((r) => r.slug === slug)!;
  await editor(page, reference.js);
  if (!(await page.evaluate(() => !!document.fullscreenElement)))
    await page.getByRole("button", { name: "Return to fullscreen" }).click();
  await expect
    .poll(() => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => document.exitFullscreen());
    await page.getByRole("button", { name: "Return to fullscreen" }).click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(true);
  }
  await expect(
    page.getByText("Session flagged", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "It works. Now, how well?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep practicing" }).click();
  await page.goto("/submissions/");
  await expect(page.locator(".submission-row .badge")).toContainText("Flagged");
  await page.locator(".submission-row").click();
  await expect(
    page.getByText("Exited fullscreen", { exact: false }),
  ).toHaveCount(3);
});
