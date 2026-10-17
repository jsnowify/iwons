export async function configureOffline(production: boolean, signal: AbortSignal) {
  if (signal.aborted || !("serviceWorker" in navigator)) return;
  if (production) {
    await navigator.serviceWorker.register("/sw.js");
    return;
  }
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (signal.aborted) return;
  // In development, unregister any existing service worker and remove stale caches
  // directly without reloading the page or needing a separate cleanup worker.
  await Promise.all(registrations.filter(registration =>
    [registration.active, registration.waiting, registration.installing].some(worker => {
      if (!worker) return false;
      const script = new URL(worker.scriptURL);
      return script.origin === location.origin && script.pathname === "/sw.js";
    }),
  ).map(registration => registration.unregister()));
  if (typeof caches !== "undefined") {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("iwons-")).map(name => caches.delete(name)));
  }
}
