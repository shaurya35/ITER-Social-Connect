importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

let messaging;

// Initialize Firebase with config from API
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    console.log('🔧 Initializing Firebase in service worker with config:', config);
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);

      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/android-192x192.png',
        badge: '/android-192x192.png',
        tag: payload.data?.notificationId || 'default',
        data: payload.data || {},
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(error => {
    console.error('Failed to initialize Firebase in service worker:', error);
  });

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/notifications';
          return clients.openWindow(urlToOpen);
        }
      })
  );
});