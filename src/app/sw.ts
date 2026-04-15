/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ─── Push Notifications Handler ─────────────────────────
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const title: string = data.title ?? "منصة المدارس القرآنية";
  const options = {
    body: data.body ?? "لديك إشعار جديد",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    dir: "rtl" as const,
    lang: "ar",
    tag: data.tag ?? "default",
    data: data.url ? { url: data.url } : undefined,
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent ?? false,
  } as NotificationOptions;
  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ──────────────────────────
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/app";
  event.waitUntil(
    (self.clients as Clients).matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if ("openWindow" in self.clients) return (self.clients as Clients).openWindow(url);
    })
  );
});
