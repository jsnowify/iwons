// Development cleanup only. The build generates the offline worker in out/sw.js.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("iwons-")).map(name => caches.delete(name)));
    await self.clients.claim();
    const pages = await self.clients.matchAll({ type: "window" });
    await self.registration.unregister();
    // Reload once with fresh development HTML and chunks. Personal work lives
    // in localStorage; existing pagehide handlers flush open editor drafts.
    await Promise.allSettled(pages.map(page => page.navigate(page.url)));
  })());
});
