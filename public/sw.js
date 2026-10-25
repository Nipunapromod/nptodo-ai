self.addEventListener("push", (event) => {
  let data = { title: "NPtodo AI reminder", body: "You have a scheduled task.", url: "/tasks" };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch { data.body = event.data.text(); }
  }
  event.waitUntil(self.registration.showNotification(data.title || "NPtodo AI reminder", {
    body: data.body || "You have a scheduled task.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || "nptodo-reminder",
    data: { url: data.url || "/tasks" },
    renotify: false,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/tasks", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      if ("navigate" in existing) existing.navigate(destination);
      return existing.focus();
    }
    return self.clients.openWindow(destination);
  }));
});
