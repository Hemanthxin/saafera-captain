// Saafera Captain service worker — exists only to receive push notifications so a
// driver is alerted to a new booking even when the app is closed. It never caches
// pages or API responses.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Saafera Captain", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Saafera Captain", {
        body: data.body || "",
        tag: data.tag || undefined,
        renotify: true,
        icon: "/saafera-logo.jpg",
        badge: "/saafera-logo.jpg",
        data: { url: data.url || "/drive" },
        vibrate: [300, 120, 300, 120, 300],
        requireInteraction: true,
      }),
      // an open app refreshes immediately instead of waiting for its next poll
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "captain-push" }));
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/drive";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
