// Cache-agnostic on purpose: this service worker exists ONLY to receive push
// events and handle notification clicks while the app is closed. It does not
// do offline asset caching (fetch interception) - a hotel-dispatch app on a
// live production Supabase feed is actively unsafe to serve stale cached data.

const BASE = "/Coordinator/";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Nicosoft Dispatcher", body: "You have a new notification." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Fall back to the defaults above if the payload isn't valid JSON.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: `${BASE}icons/icon-192.png`,
      badge: `${BASE}icons/icon-192.png`,
      data: { driveId: payload.driveId || null, url: BASE },
      tag: payload.notificationType || "general",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || BASE;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(BASE) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
