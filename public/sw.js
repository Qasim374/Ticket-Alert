// Service worker — runs in the background even when the tab is closed.
// It listens for push messages from the server and shows the notification.

self.addEventListener("push", (event) => {
  let data = { title: "World Cup", body: "Goal update" };
  try {
    data = event.data.json();
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "wc-alert",
      // Ticket alerts include a buy URL; goal alerts don't.
      data: { url: data.url || "/" },
    })
  );
});

// Tapping the notification opens its target URL (the buy page for tickets,
// or just the site for goals).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      // If the target is our own site and a tab is open, focus it.
      if (target === "/") {
        for (const c of list) {
          if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
