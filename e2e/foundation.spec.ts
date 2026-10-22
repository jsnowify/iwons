import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeCode } from "./editor-fixture";
import type { FoundationPractice } from "../src/lib/foundation-track";
test.use({ serviceWorkers: "block" });

test("optional lessons save drafts, hints and completion without affecting challenge progress", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/foundation/");
  const list = page.locator(".foundation-list");
  await expect(list.getByRole("link")).toHaveCount(60);
  await expect(list.getByText("Not started", { exact: true })).toHaveCount(60);
  await page.locator(".foundation-page").screenshot({ path: "artifacts/foundation-overview-desktop.png" });
  await list.getByRole("link", { name: /Input and output/ }).click();
  await expect(page.getByText("Lesson 7 of 60", { exact: false })).toBeVisible();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.locator(".foundation-lesson").screenshot({ path: "artifacts/foundation-standalone-desktop.png" });
  await page.getByRole("button", { name: "Run and check" }).click();
  await expect(page.locator(".foundation-feedback")).toContainText('For the input "Ada"');
  await page.getByRole("button", { name: "1. Nudge", exact: true }).click();
  await page.getByRole("button", { name: "2. More specific", exact: true }).click();
  await writeCode(page, 'console.log("My draft");');
  await page.reload();
  await expect(page.locator(".monaco-editor")).toContainText("My draft");
  await expect(page.getByRole("button", { name: "2. More specific" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Next lesson", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toContainText("first + second");
  await page.getByRole("link", { name: "Previous lesson", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toContainText("My draft");
  await page.getByRole("button", { name: "3. Reveal solution" }).click();
  await expect(page.locator(".foundation-hint")).toContainText("This trips up lots of people");
  await writeCode(page, 'const name = require("fs").readFileSync(0, "utf8").trim();\nconsole.log("Hello, " + name + "!");');
  await page.getByRole("button", { name: "Run and check" }).click();
  await expect(page.locator(".foundation-feedback")).toContainText("Lesson done");
  await page.getByRole("button", { name: "Reset to starter" }).click();
  await expect(page.locator(".monaco-editor")).toContainText("Hello, Iwons!");
  await expect(page.getByText("Done. You can keep experimenting", { exact: false })).toBeVisible();
  await page.goto("/foundation/");
  await expect(list.getByRole("link", { name: /Input and output/ })).toContainText("Done");
  await expect(page.getByText("1 of 60 lessons done")).toBeVisible();
  await page.goto("/foundation/functions-procedures/");
  await expect(page.getByText("Lesson 11 of 60", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run and check" })).toBeEnabled();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:topicFoundations")!));
  expect(stored["foundation-track-v1"].steps["input-output"].completed).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:progress") ?? "{}"))).toEqual({});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:submissions") ?? "[]"))).toEqual([]);
  expect(errors).toEqual([]);
});

test("every challenge and chapter remains accessible with no lessons or solves", async ({ page }) => {
  await page.goto("/path/");
  await expect(page.locator(".path-station a.chapter-card")).toHaveCount(9);
  await expect(page.locator(".path-station.locked")).toHaveCount(0);
  for (const slug of ["receipt-arithmetic-proof-strip", "neighbor-notes-proof-strip"]) {
    await page.goto(`/problems/${slug}/`);
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
    await expect(page.locator(".gate-banner")).toHaveCount(0);
    await expect(page.locator(".foundation-discovery")).toHaveCount(0);
  }
  await page.goto("/path/8/");
  await expect(page.locator(".level-problem-link")).toHaveCount(90);
  await expect(page.getByRole("button", { name: /Start or resume foundation/ })).toHaveCount(0);
});

test("discovery dismisses across lists and related lessons stay plain suggestions", async ({ page }) => {
  await page.goto("/path/");
  await expect(page.locator(".foundation-discovery")).toHaveCount(1);
  await page.getByRole("button", { name: "Dismiss Foundation suggestion" }).click();
  await page.reload();
  await expect(page.locator(".foundation-discovery")).toHaveCount(0);
  await page.goto("/problems/");
  await expect(page.locator(".foundation-discovery")).toHaveCount(0);
  await page.goto("/problems/receipt-arithmetic-proof-strip/");
  const related = page.locator(".related-foundation");
  await expect(related).toContainText("Related lessons (optional)");
  await related.getByRole("link", { name: "Variables and constants", exact: true }).click();
  await expect(page).toHaveURL(/\/foundation\/variables-constants\/$/);
});

test("first three lessons complete with the requested beginner examples", async ({ page }) => {
  for (const id of ["variables-constants", "input-output", "operators"]) {
    const practice = JSON.parse(await readFile(`public/foundation-lessons/${id}.json`, "utf8")) as FoundationPractice;
    await page.goto(`/foundation/${id}/`);
    if (practice.type !== "code") throw new Error("code lesson expected");
    await writeCode(page, practice.languages.javascript.answerCode);
    await page.getByRole("button", { name: "Run and check" }).click();
    await expect(page.locator(".foundation-feedback")).toContainText("Lesson done");
  }
  await page.goto("/foundation/");
  await expect(page.getByText("3 of 60 lessons done")).toBeVisible();
});

test("lessons fit mobile in both themes with keyboard controls and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/foundation/variables-constants/");
  await expect(page.locator(".monaco-editor")).toBeVisible();
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: /^Switch .*theme$/ }).click();
    const example = page.getByRole("button", { name: "Hide example", exact: true });
    await example.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Peek at example" })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Peek at example" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/foundation-mobile-${theme}.png`, fullPage: true });
  }
  await page.goto("/foundation/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("practice retries, worked examples render on the server, and reveals stay out of initial HTML", async ({ page, request }) => {
  const html = await (await request.get("/foundation/variables-constants/")).text();
  expect(html).toContain("const score = 7;");
  expect(html).not.toContain("This trips up lots of people");
  expect(html).not.toContain("const score = 12;");
  let blocked = true;
  await page.route("**/foundation-lessons/variables-constants.json", async route => {
    if (blocked) await route.abort(); else await route.continue();
  });
  await page.goto("/foundation/variables-constants/");
  await expect(page.getByRole("region", { name: "Lesson practice" }).getByRole("alert")).toContainText("practice could not load");
  await expect(page.getByRole("link", { name: "Next lesson", exact: true })).toBeEnabled();
  blocked = false;
  await page.getByRole("button", { name: "Retry practice" }).click();
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await writeCode(page, "while (true) {}");
  await page.getByRole("button", { name: "Run and check" }).click();
  await expect(page.locator(".foundation-feedback")).toContainText("worker stopped it");
  await expect(page.getByRole("button", { name: "Reset to starter" })).toBeEnabled();
});

test("language switch keeps a separate draft per language and remembers the choice", async ({ page }) => {
  await page.goto("/foundation/variables-constants/");
  await expect(page.locator(".monaco-editor")).toContainText("const score = 5");
  await writeCode(page, "const score = 99;\nconsole.log(score);");
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "Python", exact: true }).click();
  await expect(page.getByRole("button", { name: "Python", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".monaco-editor")).toContainText("score = 5");
  await expect(page.getByText("In Python, score = 7 gives the number 7 the name score.")).toBeVisible();
  await writeCode(page, "score = 42\nprint(score)");
  await page.reload();
  await expect(page.getByRole("button", { name: "Python", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".monaco-editor")).toContainText("score = 42");
  await page.getByRole("button", { name: "JavaScript", exact: true }).click();
  await expect(page.locator(".monaco-editor")).toContainText("score = 99");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:topicFoundations")!)["foundation-track-v1"].steps);
  expect(Object.keys(stored).sort()).toEqual(["variables-constants", "variables-constants-python"]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:submissions") ?? "[]"))).toEqual([]);
});

test("concept lessons use no editor, explain answers kindly, and save completion", async ({ page }) => {
  await page.goto("/foundation/programming-fundamentals/");
  await expect(page.getByText("Concept lesson", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Lesson 1 of 60", { exact: false })).toBeVisible();
  await expect(page.locator(".monaco-editor")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Check yourself" })).toBeVisible();
  const first = page.getByRole("group", { name: /1\. What is source code/ });
  await first.getByLabel("The electricity a computer uses to run").check();
  await first.getByRole("button", { name: "Check answer" }).click();
  await expect(first.getByRole("status")).toContainText("Not quite yet");
  await first.getByLabel("The text of instructions that you write for a computer").check();
  await first.getByRole("button", { name: "Check answer" }).click();
  await expect(first.getByRole("status")).toContainText("Right!");
  const second = page.getByRole("group", { name: /2\. What is the main difference/ });
  await second.getByLabel(/ahead of time/).check();
  await second.getByRole("button", { name: "Check answer" }).click();
  const third = page.getByRole("group", { name: /3\. Which of these is a runtime/ });
  await expect(page.getByText("You got them all.", { exact: false })).toHaveCount(0);
  await third.getByLabel(/Node\.js/).check();
  await third.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("You got them all.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("group", { name: /1\. What is source code/ }).getByRole("button", { name: "Answered" })).toBeDisabled();
  await page.goto("/foundation/");
  await expect(page.getByRole("link", { name: /Programming fundamentals/ })).toContainText("Done");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:progress") ?? "{}"))).toEqual({});
});
