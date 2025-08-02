importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service worker installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Service worker activated');
});

let messagingInitialized = false;

self.addEventListener('message', (event) => {
  if (event.data.type === 'INIT_FIREBASE' && !messagingInitialized) {
    try {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();
      messagingInitialized = true;
      
      // Background message handler
      messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new notification',
          icon: payload.notification?.icon || '/icon-192x192.png',
          badge: '/badge.png',
          data: payload.data || {},
          vibrate: [200, 100, 200]
        };
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } catch (error) {
      console.error('Firebase init error in SW:', error);
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});