import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { completedFoundations } from "./foundation-fixture";
test.beforeEach(async ({ page }) => { await completedFoundations(page); });

test("command search loads on demand and reaches the end of the 500-problem index", async ({ page }) => {
  const manifest = JSON.parse(await readFile("src/data/curriculum.json", "utf8"));
  const last = manifest.at(-1);
  await page.goto("/");
  await page.getByRole("button", { name: "Search problems and commands" }).click();
  const dialog = page.getByRole("dialog", { name: "Jump to anything" });
  await dialog.getByRole("textbox", { name: "Search commands" }).fill(last.title);
  await dialog.locator(".command-item").filter({ hasText: last.title }).click();
  await expect(page).toHaveURL(new RegExp(`/problems/${last.slug}/$`));
  await expect(page.getByRole("heading", { name: last.title, exact: true })).toBeVisible();
});
test("the 500-card drawer paginates, resets filters, and links to complete units", async ({ page }) => {
  await page.goto("/problems/");
  await expect(page.locator(".problem-row")).toHaveCount(40);
  const first = await page.locator(".problem-title").first().textContent();
  await page.getByRole("button", {name:"Next",exact:true}).click();
  await expect(page.locator(".problem-title").first()).not.toHaveText(first!);
  await page.getByRole("combobox", {name:"Level filter"}).selectOption("8");
  await expect(page.getByText("Page 1 of 3",{exact:true})).toBeVisible();
  await page.getByRole("button", {name:"Next",exact:true}).click();
  await page.getByRole("button", {name:"Next",exact:true}).click();
  await expect(page.locator(".problem-row")).toHaveCount(10);
  await page.getByRole("textbox", {name:"Search problems"}).fill("Paid reservations:");
  await expect(page.locator(".problem-row")).toHaveCount(10);
  await page.getByRole("combobox", {name:"Level filter"}).selectOption("0");
  await expect(page.getByText("No problems in this view.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Clear filters",exact:true}).click();
  await expect(page.locator(".problem-row")).toHaveCount(40);
  await page.goto("/path/8/");
  await expect(page.locator(".path-unit")).toHaveCount(9);
  await expect(page.locator(".level-problem-link")).toHaveCount(90);
  await expect(page.locator(".path-unit").last().locator(".level-problem-link").last()).toContainText("Boss");
});
test("chapter gates, free browsing, readable text, and motion settings persist", async ({
  page,
}) => {
  await page.goto("/path/");
  await expect(page.locator(".path-station")).toHaveCount(9);
  await expect(page.locator(".path-station.planned")).toHaveCount(0);
  await page.goto("/problems/neighbor-notes-proof-strip/");
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeDisabled();
  await page.goto("/settings/");
  await page.getByRole("switch", { name: /Free browse/ }).check();
  await page.getByRole("switch", { name: /Readable text/ }).check();
  await page.getByRole("switch", { name: /motion/i }).uncheck();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-readable", "true");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await page.goto("/problems/neighbor-notes-proof-strip/");
  await page.locator(".monaco-editor").waitFor();
  await expect(
    page.getByRole("button", { name: "Run", exact: true }),
  ).toBeEnabled();
  await page.goto("/path/3/");
  await expect(
    page.getByText("Free browse is on.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".level-problem-link")).toHaveCount(55);
});
test("v1 work is readable and exportable from the archive; retired URLs explain the move", async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("archive-fixture-seeded")) return;
    localStorage.setItem("archive-fixture-seeded", "yes");
    const data = {
      profile: { name: "Original typist", avatar: "O", onboarded: true },
      progress: { "001": true },
      notes: { "001": "Original notebook entry." },
      "drafts:001:javascript": "function oldDraft(){return 42;}",
      submissions: [
        {
          id: "original",
          problemId: "001",
          at: 1700000000000,
          code: "function originalWork(){return 42;}",
          language: "javascript",
          verdict: "accepted",
          results: [],
          passed: 8,
          total: 8,
          integrity: { score: 100, events: [] },
        },
      ],
    };
    for (const [key, value] of Object.entries(data))
      localStorage.setItem("iwons:v1:" + key, JSON.stringify(value));
  });
  await page.goto("/dashboard/");
  await expect(page.locator(".profile-link")).toContainText("Original typist");
  await expect(
    page.getByRole("link", { name: "Legacy Archive" }),
  ).toBeVisible();
  await expect(
    page.locator(".stat-card").first().locator(".stat-value"),
  ).toHaveText("0/ 500");
  await page.goto("/settings/#archive");
  await page.getByText("Browse archived submissions", { exact: true }).click();
  await page.getByRole("button", { name: /Read code/ }).click();
  await expect(page.getByRole("dialog").locator(".code-view")).toContainText(
    "originalWork",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByText("Browse archived notes", { exact: true }).click();
  await expect(
    page.getByText("Original notebook entry.", { exact: true }),
  ).toBeVisible();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export everything" }).click();
  const file = await wait;
  const backup = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(backup.schemaVersion).toBe(6);
  expect(backup.data.archive.data["drafts:001:javascript"]).toContain(
    "oldDraft",
  );
  expect(backup.data.archive.data.submissions[0].code).toContain(
    "originalWork",
  );
  const retired = await request.get("/problems/two-sum/");
  expect(retired.status()).toBe(200);
  expect(await retired.text()).toContain("noindex");
  await page.goto("/problems/two-sum/");
  await expect(page.getByRole("link", { name: /Path/ }).first()).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/problems/receipt-arithmetic-proof-strip/");
  expect(sitemap).not.toContain("/problems/two-sum/");
});
