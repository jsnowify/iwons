import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("v3 Path work survives v4 migration and Foundations preferences export and restore", async ({ page }) => {
  const notes = { "path3-001": "My original Path approach" };
  await page.addInitScript(({ notes }) => {
    if (localStorage.getItem("fixture-seeded")) return;
    for (const [key, value] of Object.entries({ schemaVersion: 3, profile: { name: "Mina", avatar: "M", onboarded: true }, settings: { theme: "light", language: "javascript", fontSize: 14, tabSize: 2, freeBrowse: true }, progress: { "path3-001": true }, notes, "drafts:path3-001:java": "class Solution {}", lists: [{ id: "mine", name: "My old list", problemIds: ["path3-001"] }] })) localStorage.setItem(`iwons:v3:${key}`, JSON.stringify(value));
    localStorage.setItem("fixture-seeded", "true");
  }, { notes });
  await page.goto("/settings/");
  const picker = page.getByRole("combobox", { name: "Foundations lesson language", exact: true });
  await expect(picker).toHaveValue("en");
  await picker.selectOption("ceb"); await page.reload();
  await expect(picker).toHaveValue("ceb");
  await expect(page.getByRole("combobox", { name: "Default language", exact: true })).toHaveValue("javascript");
  const migrated = await page.evaluate(() => ({ notes: JSON.parse(localStorage.getItem("iwons:v4:notes")!), old: JSON.parse(localStorage.getItem("iwons:v3:notes")!), progress: JSON.parse(localStorage.getItem("iwons:v4:progress")!), draft: JSON.parse(localStorage.getItem("iwons:v4:drafts:path3-001:java")!) }));
  expect(migrated).toEqual({ notes, old: notes, progress: { "path3-001": true }, draft: "class Solution {}" });
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export everything", exact: true }).click();
  const download = await waiting;
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.schemaVersion).toBe(4);
  expect(backup.data.foundations).toEqual({ lessonsRead: {}, exercisesSolved: {}, checkpointScores: {} });
  backup.data.foundations = { lessonsRead: { "fixture-lesson": true }, exercisesSolved: {}, checkpointScores: { "fixture-quiz": { correct: 4, total: 5, at: 100 } } };
  await page.locator("input[type=file]").setInputFiles({ name: "v4-fixture.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "Replace with backup", exact: true }).click();
  await expect(picker).toHaveValue("ceb");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v4:foundations")!).checkpointScores["fixture-quiz"]?.correct)).toBe(4);
  await page.goto("/path/");
  await expect(page.getByRole("heading", { name: "The Iwons Path." })).toBeVisible();
});

test("migration quota failure offers an intact v3 backup instead of discarding Path work", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("iwons:v3:schemaVersion", "3");
    localStorage.setItem("iwons:v3:notes", JSON.stringify({ "path3-001": "Keep this original work" }));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith("iwons:v4:")) throw new DOMException("Full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.goto("/dashboard/");
  const warning = page.getByRole("dialog", { name: "Your storage needs some room" });
  await expect(warning).toBeVisible();
  const waiting = page.waitForEvent("download");
  await warning.getByRole("button", { name: "Export Iwons backup", exact: true }).click();
  const download = await waiting;
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.schemaVersion).toBe(3);
  expect(backup.data.notes).toEqual({ "path3-001": "Keep this original work" });
});


