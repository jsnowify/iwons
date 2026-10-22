import { test, expect, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
test.use({ serviceWorkers: "block" });
const password = "blue river morning";
function learner() { const username = `learner_${randomBytes(4).toString("hex")}`; return { username, email: `${username}@example.org`, password, displayName: "A Learner" }; }
let testAddress = 10;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${++testAddress}` }); });
async function fillSignup(page: Page, user: ReturnType<typeof learner>) {
  const form = page.getByRole("form", { name: "Create account", exact: true });
  await form.getByLabel("Username", { exact: true }).fill(user.username);
  await form.getByLabel("Email", { exact: true }).fill(user.email);
  await form.getByLabel("Display name", { exact: false }).fill(user.displayName);
  await form.getByLabel("Password", { exact: true }).fill(user.password);
  return form;
}

test("real signup, refresh, logout and login preserve guest data and the return destination", async ({ page, context }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    if (localStorage.getItem("guest-auth-fixture")) return;
    localStorage.setItem("guest-auth-fixture", "yes");
    localStorage.setItem("iwons:v6:schemaVersion", "6");
    localStorage.setItem("iwons:v6:profile", JSON.stringify({ name: "Guest", avatar: "G", onboarded: true }));
    localStorage.setItem("iwons:v6:notes", JSON.stringify({ sample: "Keep this guest note" }));
    localStorage.setItem("iwons:v6:drafts:sample:javascript", JSON.stringify("guest draft"));
  });
  const user = learner();
  await page.goto("/path/?from=auth-test#start");
  await page.locator(".account-sign-in").click();
  await page.getByRole("link", { name: "Create an account", exact: true }).click();
  const form = await fillSignup(page, user);
  await expect(form.getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByText("Available", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Show password" }).click();
  await expect(form.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await form.getByRole("button", { name: "Hide password" }).click();
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/path\/\?from=auth-test#start$/);
  const menu = page.getByRole("button", { name: `Account menu for @${user.username}` });
  await expect(menu).toBeVisible();
  await page.reload(); await expect(menu).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(menu).toBeVisible(); await menu.click();
  await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape"); await expect(menu).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1080 });
  const me = await page.evaluate(async () => { const response = await fetch("/api/auth/me/"); return { status: response.status, body: await response.json() }; });
  expect(me).toEqual({ status: 200, body: { user: { username: user.username, displayName: user.displayName } } });
  const cookies = await context.cookies(); const session = cookies.find(cookie => cookie.name === "__Host-iwons-session");
  expect(session?.httpOnly).toBe(true); expect(session?.secure).toBe(true); expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(password);
  await menu.click(); await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.locator(".auth-profile-details").getByText(`@${user.username}`, { exact: true })).toBeVisible();
  await page.goto("/path/?from=auth-test#start");
  let logoutAttempts = 0;
  await page.route("**/api/auth/logout/", async route => {
    if (++logoutAttempts === 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ status: 503, json: { error: "Sign out could not finish. Please try again." } });
    } else await route.continue();
  });
  await menu.click(); await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Signing out…", exact: true })).toBeDisabled();
  await expect(page.locator(".account-dropdown").getByRole("alert")).toHaveText("Sign out could not finish. Please try again.");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.locator(".account-sign-in")).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === "__Host-iwons-session")).toBe(false);
  await expect(page).toHaveURL(/\/path\/\?from=auth-test#start$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:notes")!))).toEqual({ sample: "Keep this guest note" });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:drafts:sample:javascript")!))).toBe("guest draft");
  await page.locator(".account-sign-in").click();
  const login = page.getByRole("form", { name: "Sign in", exact: true });
  await login.getByLabel("Username", { exact: true }).fill(user.username.toUpperCase());
  await login.getByLabel("Password", { exact: true }).fill("wrong password");
  await login.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(login.getByRole("alert")).toHaveText("Username or password is incorrect.");
  await login.getByLabel("Password", { exact: true }).fill(password);
  await login.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/path\/\?from=auth-test#start$/); await expect(menu).toBeVisible();
  await expect(page.getByRole("region", { name: "Optional device import" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("duplicate username and duplicate email give field errors while guest challenges stay open", async ({ page }) => {
  const user = learner();
  await page.goto("/signup/?next=%2Fprofile%2F");
  let form = await fillSignup(page, user);
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/profile\/$/);
  await page.getByRole("button", { name: `Account menu for @${user.username}` }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/signup/");
  form = await fillSignup(page, { ...learner(), username: user.username });
  await expect(page.getByText("That username is taken.", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByLabel("Username", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await form.getByLabel("Username", { exact: true }).fill(learner().username);
  await form.getByLabel("Email", { exact: true }).fill(user.email.toUpperCase());
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("That email is already in use.");
  await page.goto("/problems/receipt-arithmetic-proof-strip/");
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
});

test("signup works on mobile in both themes with field errors and keyboard password controls", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/signup/"); const form = page.getByRole("form", { name: "Create account", exact: true });
  await expect(page.locator(".account-sign-in")).toBeInViewport();
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("highlighted");
  await expect(form.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
  for (const theme of ["light", "dark"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: /^Switch .*theme$/ }).click();
    const toggle = form.getByRole("button", { name: "Show password" }); await toggle.focus(); await page.keyboard.press("Space");
    await expect(form.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
    await form.getByRole("button", { name: "Hide password" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/signup-mobile-${theme}.png`, fullPage: true });
  }
  await page.goto("/login/");
  await expect(page.getByRole("form").getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", "current-password");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/");
  await expect(page.locator(".account-sign-in")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("username checks cancel stale results and an unavailable hint never blocks submitting", async ({ page }) => {
  await page.route("**/api/username/available/**", async route => {
    const value = new URL(route.request().url()).searchParams.get("username");
    if (value === "slow_username") { await new Promise(resolve => setTimeout(resolve, 800)); await route.fulfill({ json: { available: false, reason: "taken" } }).catch(() => {}); }
    else if (value === "hint_unavailable") await route.fulfill({ status: 429, json: { error: "Please wait." } });
    else await route.continue();
  });
  await page.goto("/signup/"); const form = page.getByRole("form");
  const started = page.waitForRequest("**/api/username/available/?username=slow_username");
  await form.getByLabel("Username", { exact: true }).fill("slow_username"); await started;
  await form.getByLabel("Username", { exact: true }).fill(learner().username);
  await expect(page.getByText("Available", { exact: true })).toBeVisible();
  await form.getByLabel("Username", { exact: true }).fill("hint_unavailable");
  await expect(page.getByText("Availability could not be checked. You can still submit.")).toBeVisible();
  await expect(form.getByRole("button", { name: "Create account", exact: true })).toBeEnabled();
});

test("failed requests recover, loading disables submission, and unsafe return URLs go home", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/auth/login/", async route => {
    if (++attempts === 1) { await new Promise(resolve => setTimeout(resolve, 500)); await route.fulfill({ status: 503, json: { error: "Try again in a moment." } }); }
    else await route.continue();
  });
  await page.goto("/login/"); const form = page.getByRole("form");
  await form.getByLabel("Username", { exact: true }).fill("unknown_person");
  await form.getByLabel("Password", { exact: true }).fill(password);
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByRole("button", { name: "Signing in…", exact: true })).toBeDisabled();
  await expect(form.getByRole("alert")).toContainText("Try again");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Username or password is incorrect.");
  await page.goto("/signup/?next=https%3A%2F%2Fevil.test");
  const signup = await fillSignup(page, learner());
  await signup.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
});
