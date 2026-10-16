import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

test.describe("rendered route hydration", () => {
  // Service workers bypass Playwright routes; this fixture deliberately rewrites HTML.
  test.use({ serviceWorkers: "block" });

  test("the shell hydrates the rendered route when the browser URL differs", async ({ page, request }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const home = await (await request.get("/")).text();
    await page.route("**/landing-preview/", route => route.fulfill({ status: 200, contentType: "text/html", body: home }));
    await page.goto("/landing-preview/");
    await expect(page.getByRole("heading", { name: /Good ideas/ })).toBeVisible();
    await expect(page.locator(".shell")).toHaveClass(/landing-shell/);
    await expect(page.getByRole("complementary", { name: "Workspace", exact: true })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Explore Iwons" }).getByRole("link", { name: "Your desk ↗", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Back at your desk." })).toBeVisible();
    const sidebar = page.getByRole("complementary", { name: "Workspace", exact: true });
    await expect(sidebar.getByRole("link", { name: "Your desk", exact: true })).toHaveAttribute("aria-current", "page");
    await page.goBack();
    await expect(page.locator(".shell")).toHaveClass(/landing-shell/);
    await page.reload();
    await expect(page.getByRole("heading", { name: /Good ideas/ })).toBeVisible();
    await expect(page.locator(".shell")).toHaveClass(/landing-shell/);
    expect(errors).toEqual([]);
  });
});

test("development cleanup retires the old worker without clearing personal work", async ({ page }) => {
  const cleanup = await readFile("public/sw.js", "utf8");
  const legacy = `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));`;
  let development = false;
  const server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (request.url === "/sw.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(development ? cleanup : legacy);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end("<!doctype html><html lang='en'><title>Worker fixture</title><h1>Saved work</h1></html>");
    }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing worker fixture port");
  try {
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.evaluate(async () => {
      localStorage.setItem("iwons:v3:notes", JSON.stringify({ draft: "Keep this note" }));
      await (await caches.open("iwons-old-build")).put("/marker", new Response("old"));
      await (await caches.open("another-app")).put("/marker", new Response("keep"));
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    development = true;
    const reloaded = page.waitForEvent("framenavigated", frame => frame === page.mainFrame());
    await page.evaluate(() => { void navigator.serviceWorker.getRegistration().then(registration => registration?.update()); });
    await reloaded;
    await expect(page.getByRole("heading", { name: "Saved work" })).toBeVisible();
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    const result = await page.evaluate(async () => ({ caches: await caches.keys(), notes: localStorage.getItem("iwons:v3:notes") }));
    expect(result.caches).not.toContain("iwons-old-build");
    expect(result.caches).toContain("another-app");
    expect(JSON.parse(result.notes!)).toEqual({ draft: "Keep this note" });
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
