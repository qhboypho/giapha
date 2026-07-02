export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (isLocalHost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => undefined);

      if ("caches" in window) {
        caches.keys()
          .then((keys) => Promise.all(
            keys
              .filter((key) => key.startsWith("giapha-tc-pwa-"))
              .map((key) => caches.delete(key))
          ))
          .catch(() => undefined);
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => undefined);
  });
}
