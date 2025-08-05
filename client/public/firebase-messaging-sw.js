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

// 🔔 Background push handler
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Received background message:', payload);
  const title = payload.notification?.title || "New Notification";
  const options = {
    body: payload.notification?.body || "You have a new update",
    icon: '/android-192x192.png',
    data: payload.data
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';
  event.waitUntil(clients.openWindow(urlToOpen));
});

// -----------------------------
// ⚙️ App Shell + PWA Support
// -----------------------------

const CACHE_NAME = "iter-social-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
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
