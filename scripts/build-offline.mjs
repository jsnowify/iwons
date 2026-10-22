import fs from "node:fs";
import path from "node:path";
// Next's export can emit a notFound page as an HTML file. A development-only
// route must be absent on plain static hosts so it really returns HTTP 404.
const exportRoot = path.resolve("out");
const devContentRoot = path.resolve(exportRoot, "dev");
if (!devContentRoot.startsWith(exportRoot + path.sep)) throw new Error("Invalid development export cleanup path.");
fs.rmSync(devContentRoot, {recursive:true,force:true});
const files = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else files.push(file.replaceAll("\\", "/").replace(/^out/, ""));
  }
}
walk("out");
// Static exports do not carry Next's font preload response headers. Preserve
// next/font's generated hints in HTML so plain static hosts load display type early.
// Next marks the selected preload subsets with -s.p. in emitted font filenames.
const fontPaths = [
  ...new Set(
    files
      .filter((file) => file.endsWith(".css"))
      .flatMap((file) =>
        [
          ...fs
            .readFileSync("out" + file, "utf8")
            .matchAll(/url\((\/_next\/static\/media\/[^)]+-s\.p\.woff2)\)/g),
        ].map((match) => match[1]),
      ),
  ),
];
const fontLinks = fontPaths
  .map(
    (font) =>
      `<link rel="preload" as="font" type="font/woff2" href="${font}" crossorigin="anonymous"/>`,
  )
  .join("");
for (const file of files.filter((f) => f.endsWith(".html"))) {
  const target = "out" + file;
  const html = fs.readFileSync(target, "utf8");
  if (!html.includes(fontLinks))
    fs.writeFileSync(target, html.replace("<head>", "<head>" + fontLinks));
}
// Next exports segmented RSC files as nested directories on Windows, but requests dotted paths.
for (const file of [...files]) {
  const marker = file.indexOf("/__next.");
  if (marker < 0) continue;
  const head = file.slice(0, marker + 1),
    tail = file.slice(marker + 1);
  if (tail.includes("/")) {
    const alias = head + tail.replaceAll("/", ".");
    fs.copyFileSync("out" + file, "out" + alias);
    files.push(alias);
  }
}

// Cache the shell first; visited routes and lazy runtimes are cached by fetch.
// Route-specific chunks must stay lazy even during service-worker installation.
const core = new Set([
  "/",
  "/about/",
  "/path/",
  "/path/0/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/192/",
  "/icons/512/",
]);
// Preserve offline typography without downloading every feature's JavaScript.
const coreAssets = new Set(fontPaths);
for (const route of core) {
  const documentPath = path.join("out", route, "index.html");
  if (!fs.existsSync(documentPath)) continue;
  const html = fs.readFileSync(documentPath, "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g))
    coreAssets.add(match[1]);
}
const precache = files
  .map((f) => (f.endsWith("/index.html") ? f.slice(0, -10) : f))
  .filter(
    (f) =>
      core.has(f) || coreAssets.has(f),
  );
const revision = Date.now().toString(36);
const source = `const CACHE='iwons-${revision}';const PRECACHE=${JSON.stringify(precache)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('iwons-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.pathname.startsWith('/api/'))return;if(e.request.method!=='GET'||(u.origin!==self.location.origin&&u.hostname!=='cdn.jsdelivr.net'))return;if(u.origin===self.location.origin&&(!u.pathname.startsWith('/_next/')&&!u.pathname.startsWith('/monaco/')&&!u.pathname.startsWith('/runners/')&&!u.pathname.startsWith('/problem-data/'))){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>{const exact=await caches.match(e.request);if(exact)return exact;const page=await caches.match(u.pathname,{ignoreSearch:true});return page||new Response('This page is not cached yet. Reconnect and try again.',{status:503});}));return;}e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;})));});`;
// Write production offline worker to out/sw.js, public/sw.js and Vercel static output
// so that static hosts (Vercel) and subsequent builds always serve the real offline worker.
fs.writeFileSync("out/sw.js", source);
fs.writeFileSync("public/sw.js", source);
if (fs.existsSync(".vercel/output/static")) {
  fs.writeFileSync(".vercel/output/static/sw.js", source);
}
console.log("Offline cache prepared: " + precache.length + " files.");
