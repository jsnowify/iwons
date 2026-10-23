import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";

test.use({ serviceWorkers: "block" });
const password = "blue river morning";
let address = 120;
interface Actor { context: BrowserContext; page: Page; username: string }

/** A signed-in person with their own browser context and rate-limit identity. */
async function actor(browser: Browser, label: string): Promise<Actor> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block", extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${++address}` } });
  const page = await context.newPage();
  const username = `${label}_${randomBytes(3).toString("hex")}`;
  await page.goto("/signup/");
  const form = page.getByRole("form", { name: "Create account", exact: true });
  await form.getByLabel("Username", { exact: true }).fill(username);
  await form.getByLabel("Email", { exact: true }).fill(`${username}@example.org`);
  await form.getByLabel("Display name", { exact: false }).fill(label.toUpperCase());
  await form.getByLabel("Password", { exact: true }).fill(password);
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator(".account-trigger")).toBeVisible({ timeout: 30_000 });
  return { context, page, username };
}
async function guest(browser: Browser): Promise<Actor> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block", extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${++address}` } });
  return { context, page: await context.newPage(), username: "" };
}
/** Same-origin fetch from the page, so cookies and the Origin header match the real UI. */
async function call<T = Record<string, unknown>>(page: Page, path: string, method = "GET", body?: unknown) {
  return page.evaluate(async ({ path, method, body }) => {
    const response = await fetch(path, { method, credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() as unknown };
  }, { path, method, body }) as Promise<{ status: number; body: T }>;
}
async function makeRoom(host: Actor, extra: Record<string, unknown> = {}) {
  const created = await call<{ code: string; id: string; invite: { token: string } }>(host.page, "/api/rooms/", "POST", { name: "Study group", description: "Weekly practice", ...extra });
  expect(created.status).toBe(201);
  return { code: created.body.code, id: created.body.id, token: created.body.invite.token };
}
const catalog = async (host: Actor) => (await call<{ problems: { id: string; title: string }[] }>(host.page, "/api/rooms/catalog/?q=&limit=1")).body.problems[0];
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const doneResult = { state: "done", result: { verdict: "accepted", failureSource: "user", passed: 3, total: 3, runtimeMs: 12, memoryKb: 2048, message: "All test cases passed.", hiddenCases: [{ index: 1, status: "passed" }],
  cases: [{ id: "case-1", passed: true, stdout: "PASS", runtimeMs: 4 }, { id: "case-2", passed: true, stdout: "PASS", runtimeMs: 4 }] } };

test("guests get a sign-in gate for rooms and an invite page that reveals nothing about the problems", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host), problem = await catalog(host);
  expect((await call(host.page, `/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: problem.id })).status).toBe(201);
  const visitor = await guest(browser);
  await visitor.page.goto("/rooms/");
  await expect(visitor.page.getByText("Sign in to use private rooms")).toBeVisible();
  await visitor.page.goto(`/rooms/join/${room.token}/`);
  await expect(visitor.page.getByRole("heading", { name: /Study group/ })).toBeVisible();
  await expect(visitor.page.getByText("Hosted by HOST")).toBeVisible();
  await expect(visitor.page.getByRole("link", { name: "Create an account" })).toBeVisible();
  await expect(visitor.page.getByRole("button", { name: "Join room" })).toHaveCount(0);
  expect(await visitor.page.locator("body").innerText()).not.toContain(problem.title);
  const preview = await call(visitor.page, `/api/rooms/join/${room.token}/`);
  expect(Object.keys(preview.body).sort()).toEqual(["hostName", "maxMembers", "memberCount", "name", "state"]);
  expect((await call(visitor.page, `/api/rooms/${room.code}/`)).status).toBe(401);
  expect((await call(visitor.page, `/api/rooms/join/${room.token}/`, "POST")).status).toBe(401);
  await host.context.close(); await visitor.context.close();
});

test("a host creates a room with the form, manages the invite link and the old link stops working", async ({ browser }) => {
  const host = await actor(browser, "host"), page = host.page;
  await page.goto("/rooms/new/");
  await page.getByRole("button", { name: "Create room" }).click();
  await expect(page.getByText("Use at least 3 characters for the room name.")).toBeVisible();
  await page.getByLabel("Room name").fill("Friday study group");
  await page.getByLabel("Description", { exact: false }).fill("Weekly practice");
  await page.getByRole("button", { name: "Create room" }).click();
  await expect(page).toHaveURL(/\/rooms\/[a-z0-9]{8}\/$/);
  await expect(page.getByRole("heading", { name: /Friday study group/ })).toBeVisible();
  await expect(page.getByText("Room results don’t count toward your global leaderboard.")).toBeVisible();
  await expect(page.getByText("No problems yet.")).toBeVisible();
  await page.getByRole("tab", { name: "Invite" }).click();
  const link = page.getByRole("textbox", { name: "Invite link" });
  const first = await link.inputValue();
  expect(first).toMatch(/\/rooms\/join\/[A-Za-z0-9_-]{22}\/$/);
  await page.getByRole("button", { name: "Regenerate link" }).click();
  await expect(page.getByText("The old link stops working.")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Regenerate link" }).click();
  await expect(page.getByText("New link created. The old one no longer works.")).toBeVisible();
  await expect(link).not.toHaveValue(first);
  const second = await link.inputValue();
  const visitor = await guest(browser);
  await visitor.page.goto(first);
  await expect(visitor.page.getByRole("heading", { name: /This invite doesn’t work/ })).toBeVisible();
  await visitor.page.goto(second);
  await expect(visitor.page.getByRole("heading", { name: /Friday study group/ })).toBeVisible();
  await host.context.close(); await visitor.context.close();
});

test("a member joins from the link, sees the problems and an empty leaderboard, and can leave", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host), problem = await catalog(host);
  await call(host.page, `/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: problem.id });
  const member = await actor(browser, "mia"), page = member.page;
  expect((await call(page, `/api/rooms/${room.code}/`)).status).toBe(404);
  await page.goto(`/rooms/join/${room.token}/`);
  await page.getByRole("button", { name: "Join room" }).click();
  await expect(page).toHaveURL(new RegExp(`/rooms/${room.code}/$`));
  await expect(page.getByRole("link", { name: new RegExp(problem.title) })).toBeVisible();
  await expect(page.getByText("Not attempted")).toBeVisible();
  await page.getByRole("tab", { name: "Leaderboard" }).click();
  await expect(page.getByText("No solves yet. Be the first.")).toBeVisible();
  await page.getByRole("tab", { name: "Members" }).click();
  await expect(page.getByRole("list", { name: "Room members" }).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("tab", { name: "Settings" })).toHaveCount(0);
  expect((await call(page, `/api/rooms/${room.code}/members/x/kick/`, "POST")).status).toBe(403);
  expect((await call(page, `/api/rooms/${room.code}/invite/regenerate/`, "POST", {})).status).toBe(403);
  await page.getByRole("button", { name: "Leave room" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Leave room" }).click();
  await expect(page).toHaveURL(/\/rooms\/$/);
  await page.getByRole("tab", { name: /Joined/ }).click();
  await expect(page.getByText("You haven’t joined a room yet.")).toBeVisible();
  await host.context.close(); await member.context.close();
});

test("a removed member loses access and cannot rejoin with the same link", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host);
  const member = await actor(browser, "kim");
  await member.page.goto(`/rooms/join/${room.token}/`);
  await member.page.getByRole("button", { name: "Join room" }).click();
  await expect(member.page).toHaveURL(new RegExp(`/rooms/${room.code}/$`));
  await host.page.goto(`/rooms/${room.code}/`);
  await host.page.getByRole("tab", { name: "Members" }).click();
  await host.page.getByRole("button", { name: "Remove KIM" }).click();
  await host.page.getByRole("dialog").getByRole("button", { name: "Remove member" }).click();
  await expect(host.page.getByRole("list", { name: "Room members" }).getByRole("listitem")).toHaveCount(1);
  await member.page.reload();
  await expect(member.page.getByText("This room was not found, or you are not a member of it.")).toBeVisible();
  await member.page.goto(`/rooms/join/${room.token}/`);
  await member.page.getByRole("button", { name: "Join room" }).click();
  await expect(member.page.getByRole("alert").filter({ hasText: "You were removed" })).toBeVisible();
  await host.context.close(); await member.context.close();
});

test("full and ended rooms explain themselves and block submissions", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host, { maxMembers: 1 }), problem = await catalog(host);
  await call(host.page, `/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: problem.id });
  const other = await actor(browser, "ben");
  await other.page.goto(`/rooms/join/${room.token}/`);
  await expect(other.page.getByText("This room is full right now.")).toBeVisible();
  await expect(other.page.getByRole("button", { name: "Join room" })).toHaveCount(0);
  await host.page.goto(`/rooms/${room.code}/`);
  await host.page.getByRole("tab", { name: "Settings" }).click();
  await host.page.getByRole("button", { name: "End room" }).first().click();
  await host.page.getByRole("dialog").getByRole("button", { name: "End room" }).click();
  await expect(host.page.getByText("This room has ended. You can still look around")).toBeVisible();
  await host.page.goto(`/rooms/${room.code}/problems/c-${problem.id}/`);
  await expect(host.page.getByRole("button", { name: "Submit" })).toBeDisabled();
  await expect(host.page.getByText("submissions are closed", { exact: false }).first()).toBeVisible();
  await other.page.goto(`/rooms/join/${room.token}/`);
  await expect(other.page.getByText("This room has ended", { exact: false }).first()).toBeVisible();
  const blocked = await call(host.page, "/api/judge/", "POST", { problemId: `c-${problem.id}`, language: "python", code: "x = 1", mode: "submit", roomId: room.id });
  expect(blocked.status).toBe(409);
  await host.context.close(); await other.context.close();
});

test("room problems submit through the room judge and never touch local or global progress", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host), problem = await catalog(host);
  await call(host.page, `/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: problem.id });
  const member = await actor(browser, "ivy"), page = member.page;
  await call(page, `/api/rooms/join/${room.token}/`, "POST");
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/judge/", async route => { sent = route.request().postDataJSON() as Record<string, unknown>; await route.fulfill({ status: 202, json: { jobId: "e".repeat(64) } }); });
  await page.route(/\/api\/judge\/[a-f0-9]{64}\/$/, route => route.fulfill({ json: doneResult }));
  await page.goto(`/rooms/${room.code}/problems/c-${problem.id}/`);
  await expect(page.getByRole("heading", { name: new RegExp(problem.title) })).toBeVisible();
  await expect(page.getByText("Room results don’t count toward your global leaderboard.")).toBeVisible();
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("combobox", { name: "Language" }).locator("option")).toHaveText(["JavaScript", "Python"]);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("3/3 tests passed")).toBeVisible({ timeout: 20_000 });
  expect(sent).toMatchObject({ problemId: `c-${problem.id}`, mode: "submit", roomId: room.id });
  await expect(page.getByRole("link", { name: "room leaderboard" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:submissions") ?? "[]"))).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("iwons:v6:progress") ?? "{}"))).toEqual({});
  await host.context.close(); await member.context.close();
});

test("the custom problem editor validates input, creates the problem and reports validation results", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host), page = host.page;
  await page.goto(`/rooms/${room.code}/custom/new/`);
  await page.getByRole("button", { name: "Create problem" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Give the problem a title" })).toBeVisible();
  await page.getByLabel("Title").fill("Echo twice");
  await page.getByLabel("Statement").fill("Print the input two times.");
  await page.getByLabel("Input").nth(0).fill("a"); await page.getByLabel("Expected output").nth(0).fill("aa");
  await page.getByLabel("Input").nth(1).fill("xy"); await page.getByLabel("Expected output").nth(1).fill("xyxy");
  await page.getByRole("button", { name: "Create problem" }).click();
  await expect(page).toHaveURL(new RegExp(`/rooms/${room.code}/custom/[a-z0-9]+/$`));
  await expect(page.getByText("Needs validation")).toBeVisible();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Paste your reference solution first." })).toBeVisible();
  let attempt = 0;
  await page.route(/\/validate\/$/, route => route.fulfill({ status: 202, json: { jobId: "d".repeat(64) } }));
  await page.route(/\/api\/judge\/[a-f0-9]{64}\/$/, route => route.fulfill({ json: ++attempt === 1 ? { state: "done", result: { ...doneResult.result, verdict: "wrong_answer", passed: 1, total: 3, hiddenCases: [{ index: 1, status: "failed" }] } } : doneResult }));
  await page.getByLabel("Reference solution").fill("console.log(1)");
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "1 of 3 cases passed" })).toBeVisible({ timeout: 20_000 });
  // The result names a count only: no hidden input, output or per-case status is exposed to the host here.
  expect(await page.getByRole("alert").filter({ hasText: "1 of 3 cases passed" }).innerText()).not.toMatch(/failed|xyxy/i);
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByText("All 3 test cases passed. This problem is validated.")).toBeVisible({ timeout: 20_000 });
  await page.goto(`/rooms/${room.code}/`);
  await expect(page.getByText("Needs validation")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to room" })).toBeDisabled();
  await host.context.close();
});

test("room pages fit a 320px phone without horizontal scrolling and keep touch targets large", async ({ browser }) => {
  const host = await actor(browser, "host"), room = await makeRoom(host), problem = await catalog(host);
  await call(host.page, `/api/rooms/${room.code}/problems/`, "POST", { source: "catalog", problemId: problem.id });
  await host.page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/rooms/", "/rooms/new/", `/rooms/${room.code}/`, `/rooms/${room.code}/custom/new/`, `/rooms/join/${room.token}/`]) {
    await host.page.goto(path);
    await host.page.waitForLoadState("networkidle");
    expect(await noOverflow(host.page), path).toBe(true);
  }
  await host.page.goto(`/rooms/${room.code}/`);
  for (const name of ["Problems", "Leaderboard", "Members", "Settings", "Invite"]) {
    const box = await host.page.getByRole("tab", { name }).boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(36);
  }
  await host.page.getByRole("tab", { name: "Leaderboard" }).click();
  await expect(host.page.getByText("No solves yet. Be the first.")).toBeVisible();
  expect(await noOverflow(host.page)).toBe(true);
  await host.page.screenshot({ path: "artifacts/rooms-mobile.png", fullPage: true });
  await host.context.close();
});
