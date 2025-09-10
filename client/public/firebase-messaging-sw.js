// Firebase imports for messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('[SW] Service worker starting...');

// -----------------------------
// 🔥 Firebase Setup
// -----------------------------
firebase.initializeApp({
  apiKey: "AIzaSyBwheNR8N1_bvK4RrJ7WA8iXEg8LiN2OIA",
  projectId: "social-connect-iter",
  messagingSenderId: "701100559294",
  appId: "1:701100559294:web:de80b87e6cd1e7f38607ef"
});
const messaging = firebase.messaging();

// 🔔 Background push handler (expects DATA-ONLY messages)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);
  const data = payload.data || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new update',
    icon: '/android-192x192.png',
    data,
    tag: `${data.type || 'generic'}:${data.senderId || ''}`,
    renotify: false,
  };

  // Prevent duplicate by checking existing notifications with same tag
  eventWaitUntilShow(title, options);
});

function eventWaitUntilShow(title, options) {
  self.registration.getNotifications({ includeTriggered: true }).then((notifs) => {
    const duplicate = notifs.some((n) => n.tag && n.tag === options.tag);
    if (duplicate) {
      // update existing by closing and re-showing (refresh timestamp)
      notifs.forEach((n) => {
        if (n.tag === options.tag) n.close();
      });
    }
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  const dataUrl = event.notification.data?.url || '/notifications';

  // Force an in-scope, relative path to keep navigation inside the installed PWA
  const targetPath = (() => {
    try {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('/')) return dataUrl;
      const u = new URL(dataUrl);
      if (u.origin === self.location.origin) return u.pathname + u.search + u.hash;
      return '/notifications';
    } catch {
      return '/notifications';
    }
  })();

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Prefer any client already controlled by this SW (should be the PWA window)
    let client = allClients.find((c) => c.url && c.visibilityState !== 'hidden');

    if (client) {
      try {
        // Navigate existing client if needed, then focus it
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname !== targetPath) {
          await client.navigate(targetPath);
        }
        await client.focus();
        return;
      } catch {}
    }

    // No suitable client; open a new in-scope window (should open in PWA if installed)
    await clients.openWindow(targetPath);
  })());
});

// -----------------------------
// ⚙️ App Shell + PWA Support
// -----------------------------

const CACHE_NAME = "iter-social-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/android-192x192.png",
  "/android-512x512.png",
  "/favicon.ico",
];

// ⚡ Install: cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.error("[SW] Error caching during install", err);
      });
    })
  );
  self.skipWaiting(); // Immediately activate new SW
});

// 🧼 Activate: clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🛰 Fetch: serve cached assets when offline
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only GET requests should be cached
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).catch(() => caches.match("/"));
    })
  );
});
