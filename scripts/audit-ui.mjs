import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

// Audit the production Next server with a fresh local profile. No personal browser data is read.
const routes = ["/", "/dashboard/", "/path/", "/path/0/", "/path/8/", "/problems/", "/problems/receipt-arithmetic-proof-strip/", "/problems/new/", "/problems/custom/", "/submissions/", "/submissions/detail/", "/progress/", "/review/", "/lists/", "/plans/", "/contest/", "/warm-up/", "/settings/", "/about/", "/design/", "/visualizer/", ...["bubble-sort", "binary-search", "fibonacci-dp", "bfs-graph", "binary-tree-inorder", "reverse-linked-list"].map(id => `/visualizer/${id}/`)];
const widths = [320, 768, 1280, 1920];
const themes = ["light", "dark"];
const output = path.resolve("artifacts/ui-audit");
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "4175"], { env: process.env, windowsHide: true, stdio: "ignore" });
let browser;
const results = [];
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4175/")).ok) break; } catch { /* server starting */ }
    if (attempt === 99) throw new Error("Audit server did not start.");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  // Two independent pages keep the audit quick without swamping the local server.
  const jobs = widths.flatMap(width => themes.map(theme => ({ width, theme })));
  let next = 0;
  await Promise.all([0, 1].map(async () => {
    while (next < jobs.length) {
      const { width, theme } = jobs[next++];
      const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: "block", reducedMotion: "reduce" });
      await context.addInitScript(theme => {
        localStorage.setItem("iwons:v6:schemaVersion", "6");
        localStorage.setItem("iwons:v6:settings", JSON.stringify({ theme, language: "javascript", fontSize: 14, tabSize: 2, motion: false, sound: false }));
        localStorage.setItem("iwons:v6:profile", JSON.stringify({ name: "UI audit", avatar: "U", onboarded: true }));
      }, theme);
      const page = await context.newPage();
      for (const route of routes) {
        const errors = [];
        const onError = error => errors.push(error.message);
        page.on("pageerror", onError);
        try {
          const response = await page.goto(`http://127.0.0.1:4175${route}`, { waitUntil: "networkidle", timeout: 30000 });
          if (route.startsWith("/visualizer/") && route !== "/visualizer/") {
            await page.locator(".engine-svg-stage, .engine-empty-message").first().waitFor({ timeout: 15000 });
            if (width < 1024) await page.getByRole("button", { name: "Toggle input panel" }).click();
          }
          if (route.includes("/problems/receipt-")) {
            if (width < 1024) await page.getByRole("button", { name: "Code & results" }).click();
            await page.locator(".monaco-editor").waitFor({ timeout: 15000 });
          }
          await page.evaluate(() => document.fonts.ready);
          const geometry = await page.evaluate(() => {
            const visible = node => { const box = node.getBoundingClientRect(); const css = getComputedStyle(node); return box.width > 1 && box.height > 1 && css.visibility !== "hidden" && css.display !== "none"; };
            const describe = node => `${node.tagName.toLowerCase()}${node.className && typeof node.className === "string" ? "." + node.className.trim().replaceAll(/\s+/g, ".") : ""}`;
            const outside = [...document.querySelectorAll("main *, footer *")].filter(node => {
              if (!visible(node) || node.closest("svg, .monaco-editor, .visually-hidden, .sr-only")) return false;
              const box = node.getBoundingClientRect();
              if (box.right <= innerWidth + 1 && box.left >= -1) return false;
              for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
                if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) return false;
              }
              return true;
            }).map(node => ({ element: describe(node), text: node.textContent?.trim().slice(0, 65), right: Math.round(node.getBoundingClientRect().right), width: Math.round(node.getBoundingClientRect().width) })).slice(0, 12);
            const leakedLabels = [...document.querySelectorAll(".visually-hidden")].filter(visible).map(node => node.textContent?.trim());
            const engine = document.querySelector(".visualizer-engine-container");
            const canvas = document.querySelector(".stage-canvas-card");
            return { pageWidth: document.documentElement.scrollWidth, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1, outside, leakedLabels, engineRatio: engine && canvas ? Number((engine.getBoundingClientRect().width / canvas.clientWidth).toFixed(2)) : null };
          });
          const name = `${route.replaceAll("/", "_") || "home"}-${width}-${theme}`;
          if (width === 320 || width === 1920 || geometry.overflow) await page.screenshot({ path: path.join(output, `${name}.png`) });
          results.push({ route, width, theme, status: response?.status(), ...geometry, errors });
        } catch (error) { results.push({ route, width, theme, error: error.message }); }
        finally { page.off("pageerror", onError); }
      }
      await context.close();
      console.log(`Audited ${routes.length} routes at ${width}px in ${theme} mode.`);
    }
  }));
  const issues = results.filter(result => result.error || result.status !== 200 || result.overflow || result.outside?.length || result.leakedLabels?.length || result.errors?.length || (result.engineRatio !== null && result.engineRatio < 0.8));
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ routes: routes.length, checks: results.length, widths, themes, issues, results }, null, 2));
  console.log(JSON.stringify({ checks: results.length, issues: issues.length, report: path.join(output, "report.json") }));
} finally {
  await browser?.close();
  server.kill();
}
