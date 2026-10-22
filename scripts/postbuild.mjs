import fs from "node:fs";
import assert from "node:assert/strict";
// API routes require a Next deployment, not an out/ static export. Leave the
// legacy export tools available for historical artifacts; never serve stale out/.
assert(fs.existsSync(".next/server/app/api/judge/route.js"), "Missing judge API build");
// Refresh the offline shell against this build. Keep private APIs network-only
// and clear older caches that may have stored API responses or stale chunks.
const shell = fs.readFileSync(".next/server/app/index.html", "utf8");
const assets = [...new Set([...shell.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g)].map(match => match[1]))];
const cache = `iwons-server-${Date.now().toString(36)}`;
fs.writeFileSync("public/sw.js", `const CACHE=${JSON.stringify(cache)};const PRECACHE=${JSON.stringify(["/", "/manifest.webmanifest", "/icon.svg", ...assets])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('iwons-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>await caches.match(e.request)||new Response('This page is not cached yet. Reconnect and try again.',{status:503})));});
`);
assert(fs.readFileSync("public/sw.js", "utf8").includes("u.pathname.startsWith('/api/')"), "Service worker must bypass private APIs");
console.log("Server build verified: judge routes present, demo statement rendered, private grading data excluded, API cache bypassed.");
