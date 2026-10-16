export async function configureOffline(production: boolean, signal: AbortSignal) {
  if (signal.aborted || !("serviceWorker" in navigator)) return;
  if (production) {
    await navigator.serviceWorker.register("/sw.js");
    return;
  }
  const registrations = await navigator.serviceWorker.getRegistrations();
  if (signal.aborted) return;
  // public/sw.js is a cleanup worker in development. Updating an existing
  // registration replaces stale production caches and refreshes its clients.
  await Promise.all(registrations.filter(registration =>
    [registration.active, registration.waiting, registration.installing].some(worker => {
      if (!worker) return false;
      const script = new URL(worker.scriptURL);
      return script.origin === location.origin && script.pathname === "/sw.js";
    }),
  ).map(registration => registration.update()));
}
