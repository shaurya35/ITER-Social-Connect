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
  const urlToOpen = new URL(dataUrl, self.location.origin).href;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    let client = allClients.find((c) => {
      try {
        const cUrl = new URL(c.url);
        const target = new URL(urlToOpen);
        return cUrl.origin === target.origin && cUrl.pathname === target.pathname;
      } catch { return false; }
    });
    if (client) {
      client.focus();
    } else {
      await clients.openWindow(urlToOpen);
    }
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
