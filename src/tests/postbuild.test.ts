import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/postbuild.mjs", import.meta.url));
const roots: string[] = [];
const html = '<link href="/_next/static/site.css?dpl=current"><script src="/_next/static/site.js?dpl=current&amp;v=1"></script>';
async function fixture(home: string, withApi = true) {
  const root = await mkdtemp(path.join(tmpdir(), "iwons-postbuild-")); roots.push(root);
  await mkdir(path.join(root, "public"), { recursive: true });
  await writeFile(path.join(root, "public/sw.js"), "old worker");
  await mkdir(path.dirname(path.join(root, home)), { recursive: true });
  await writeFile(path.join(root, home), html);
  if (withApi) {
    const api = path.join(root, ".next/server/app/api/judge/route.js");
    await mkdir(path.dirname(api), { recursive: true }); await writeFile(api, "built API");
  }
  return root;
}
const run = (root: string) => execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8", stdio: "pipe" });
async function worker(root: string) { return readFile(path.join(root, "public/sw.js"), "utf8"); }
afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (!path.resolve(root).startsWith(path.resolve(tmpdir()) + path.sep + "iwons-postbuild-")) throw new Error("Unexpected test cleanup path");
    await rm(root, { recursive: true, force: true });
  }
});

describe("offline postbuild across deployment outputs", () => {
  it("generates a local worker with the actual assets and deployment query strings", async () => {
    const root = await fixture(".next/server/app/index.html"); run(root);
    const source = await worker(root);
    expect(source).toContain('"/_next/static/site.css?dpl=current"');
    expect(source).toContain('"/_next/static/site.js?dpl=current&v=1"');
    expect(source).toContain("u.pathname.startsWith('/api/')");
    expect(source).not.toContain("page.navigate");
  });
  it("uses the relocated Next adapter prerender and updates the already copied worker", async () => {
    const root = await fixture(".next/output/functions/index.prerender-fallback.html");
    await mkdir(path.join(root, ".next/output/static"), { recursive: true });
    await writeFile(path.join(root, ".next/output/static/sw.js"), "stale copied worker");
    run(root);
    expect(await readFile(path.join(root, ".next/output/static/sw.js"), "utf8")).toBe(await worker(root));
    expect(await worker(root)).toContain("/_next/static/site.js?dpl=current&v=1");
  });
  for (const output of [".next/output", ".vercel/output"]) it(`supports static HTML in ${output}`, async () => {
    const root = await fixture(`${output}/static/index.html`); run(root);
    expect(await readFile(path.join(root, output, "static/sw.js"), "utf8")).toBe(await worker(root));
  });
  it("rejects a missing homepage instead of retaining a stale worker", async () => {
    const root = await fixture("unused/index.html");
    expect(() => run(root)).toThrow(); expect(await worker(root)).toBe("old worker");
  });
  it("rejects missing APIs and asset-free HTML rather than accepting incomplete output", async () => {
    const noApi = await fixture(".next/server/app/index.html", false);
    expect(() => run(noApi)).toThrow();
    const noAssets = await fixture(".next/server/app/index.html");
    await writeFile(path.join(noAssets, ".next/server/app/index.html"), "<h1>Incomplete shell</h1>");
    expect(() => run(noAssets)).toThrow(); expect(await worker(noAssets)).toBe("old worker");
  });
});
