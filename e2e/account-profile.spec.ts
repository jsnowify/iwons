import { test, expect, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import fs from "node:fs/promises";
test.use({ serviceWorkers: "block" });
const password = "blue river morning";
let address = 100;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${++address}` }); });
async function signup(page: Page) {
  const username = `photo_${randomBytes(4).toString("hex")}`;
  await page.goto("/signup/?next=%2Fprofile%2F"); const form = page.getByRole("form", { name: "Create account", exact: true });
  await form.getByLabel("Username", { exact: true }).fill(username); await form.getByLabel("Email", { exact: true }).fill(`${username}@example.org`);
  await form.getByLabel("Password", { exact: true }).fill(password); await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/profile\/$/); await expect(page.getByRole("heading", { name: "Your profile." })).toBeVisible();
  return username;
}
async function logout(page: Page, username: string) {
  await page.getByRole("button", { name: `Account menu for @${username}` }).click(); await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.locator(".account-sign-in")).toBeVisible();
}
async function photo() { return { name: "my-photo.png", mimeType: "image/png", buffer: await sharp({ create: { width: 500, height: 300, channels: 3, background: "#2f9e8f" } }).png().toBuffer() }; }

test("a photo uploads, persists, appears in the header and sidebar, and can be removed", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await signup(page); const editor = page.getByRole("region", { name: "Profile photo (optional)" });
  await editor.getByLabel("Choose a photo").setInputFiles(await photo());
  await expect(editor.locator(".profile-avatar img")).toBeVisible();
  await editor.getByRole("button", { name: "Save photo", exact: true }).click();
  await expect(editor.getByRole("status")).toHaveText("Profile photo saved.");
  await expect(page.locator(".account-trigger img")).toHaveAttribute("src", /\/api\/me\/avatar\/\?v=/);
  expect(await page.locator(".account-trigger img").evaluate(image => new URL((image as HTMLImageElement).src).origin)).toBe("http://127.0.0.1:4173");
  await expect(page.locator(".profile-link img")).toBeVisible();
  await page.reload(); await expect(page.locator(".account-trigger img")).toBeVisible();
  await expect.poll(() => editor.locator(".profile-avatar img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(256);
  await editor.getByLabel("Choose a photo").setInputFiles({ name: "wrong-file.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
  await expect(editor.getByRole("alert")).toContainText("JPG, PNG, or WebP");
  await expect(page.locator(".account-trigger img")).toBeVisible();
  await editor.getByRole("button", { name: "Remove photo", exact: true }).click();
  await expect(editor.getByRole("status")).toHaveText("Photo removed. Your initial is back.");
  await expect(page.locator(".account-trigger img")).toHaveCount(0); await page.reload();
  await expect(editor.getByRole("button", { name: "Remove photo", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a saved private code resets a forgotten password once and signs out another device", async ({ page, browser }) => {
  const username = await signup(page), panel = page.getByRole("region", { name: "Password recovery", exact: true });
  await panel.getByLabel("Current password", { exact: true }).fill("wrong password");
  await panel.getByRole("button", { name: "Generate recovery code", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveText("Your current password is incorrect.");
  await expect(panel.getByLabel("Current password", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await panel.getByLabel("Current password", { exact: true }).fill(password);
  await panel.getByRole("button", { name: "Generate recovery code", exact: true }).click();
  const code = await panel.getByLabel("Your private recovery code", { exact: true }).inputValue();
  expect(code).toMatch(/^IWONS-/);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(code);
  const download = page.waitForEvent("download"); await panel.getByRole("button", { name: "Download code", exact: true }).click();
  const file = await download; expect(file.suggestedFilename()).toBe("iwons-recovery-code.txt"); expect(await fs.readFile((await file.path())!, "utf8")).toContain(code);
  await page.reload(); await expect(panel.getByLabel("Your private recovery code", { exact: true })).toHaveCount(0);
  await expect(panel.getByText(/A recovery code is set up/)).toBeVisible();
  const otherContext = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.220" } });
  try {
    const other = await otherContext.newPage(); await other.goto("http://127.0.0.1:4173/login/?next=%2Fprofile%2F");
    await other.getByRole("form").getByLabel("Username", { exact: true }).fill(username); await other.getByRole("form").getByLabel("Password", { exact: true }).fill(password);
    await other.getByRole("form").getByRole("button", { name: "Sign in", exact: true }).click(); await expect(other).toHaveURL(/\/profile\/$/);
    await logout(page, username); await page.locator(".account-sign-in").click(); await page.getByRole("link", { name: "Forgot your password?", exact: true }).click();
    const form = page.getByRole("form", { name: "Reset password", exact: true });
    await form.getByLabel("Username", { exact: true }).fill(username.toUpperCase()); await form.getByLabel("Recovery code", { exact: true }).fill(code);
    const newPassword = "a brand new afternoon";
    await form.getByLabel("New password", { exact: true }).fill(newPassword); await form.getByLabel("Confirm new password", { exact: true }).fill("mismatched value");
    await form.getByRole("button", { name: "Reset password", exact: true }).click();
    await expect(form.getByLabel("Confirm new password", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await form.getByLabel("Confirm new password", { exact: true }).fill(newPassword); await form.getByRole("button", { name: "Reset password", exact: true }).click();
    await expect(page).toHaveURL(/\/login\/\?password=reset$/); await expect(page.getByText("Your password was reset. Sign in with your new password.")).toBeVisible();
    expect(await other.evaluate(async () => (await fetch("/api/auth/me/")).status)).toBe(401);
    await other.reload(); await expect(other.locator(".account-sign-in")).toBeVisible();
    const login = page.getByRole("form", { name: "Sign in", exact: true }); await login.getByLabel("Username", { exact: true }).fill(username);
    await login.getByLabel("Password", { exact: true }).fill(password); await login.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(login.getByRole("alert")).toHaveText("Username or password is incorrect.");
    await login.getByLabel("Password", { exact: true }).fill(newPassword); await login.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("http://127.0.0.1:4173/");
    await page.goto("/profile/"); await expect(panel.getByText("No active recovery code yet.")).toBeVisible();
    const reused = await page.evaluate(async ({ username, code, newPassword }) => {
      const response = await fetch("/api/auth/reset-password/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, code, password: newPassword, confirmPassword: newPassword }) }); return response.status;
    }, { username, code, newPassword }); expect(reused).toBe(400);
  } finally { await otherContext.close(); }
});

test("photo and recovery controls fit mobile in both themes and reset errors are keyboard accessible", async ({ page }) => {
  await page.route("**/api/auth/recovery-code/", async route => {
    if (route.request().method() === "GET") await route.fulfill({ status: 503, json: { error: "Try again shortly." } });
    else await route.continue();
  });
  await page.setViewportSize({ width: 320, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await signup(page); const editor = page.getByRole("region", { name: "Profile photo (optional)" });
  await expect(page.getByText("Recovery setup could not be checked.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate recovery code", exact: true })).toBeEnabled();
  await editor.getByLabel("Choose a photo").setInputFiles(await photo());
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: /^Switch .*theme$/ }).click();
    const toggle = page.getByRole("button", { name: "Show current password", exact: true }); await toggle.focus(); await page.keyboard.press("Space");
    await expect(page.getByRole("form", { name: "Generate recovery code" }).getByLabel("Current password", { exact: true })).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide current password", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/profile-mobile-${theme}.png`, fullPage: true });
  }
  await page.goto("/reset-password/"); const form = page.getByRole("form", { name: "Reset password", exact: true });
  await form.getByRole("button", { name: "Reset password", exact: true }).click(); await expect(form.getByRole("alert")).toBeVisible();
  await expect(form.getByLabel("Username", { exact: true })).toBeFocused();
  await form.getByRole("button", { name: "Show recovery code", exact: true }).focus(); await page.keyboard.press("Space");
  await expect(form.getByLabel("Recovery code", { exact: true })).toHaveAttribute("type", "text");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/reset-password-mobile.png", fullPage: true });
});
