// src/components/ServiceWorkerRegistration.tsx
"use client";
import { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Fetch Firebase config from backend API
        const response = await fetch('/api/firebase-config');
        const firebaseConfig = await response.json();
        
        // 2. Initialize Firebase app
        const firebaseApp = firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();
        
        // 3. Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered:', registration);
          
          // 4. Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('🔥 Service Worker is ready');
          
          // 5. Send Firebase config to service worker
          registration.active?.postMessage({
            type: 'INIT_FIREBASE',
            config: firebaseConfig
          });
          console.log('📬 Sent Firebase config to service worker');
          
          // 6. Request notification permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('🔔 Notification permission granted');
            
            // 7. Get FCM token
            const token = await messaging.getToken();
            console.log('🔑 FCM Token:', token);
            
            // TODO: Send token to your backend for push notifications
          } else {
            console.log('🔕 Notification permission denied');
          }
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };

    initializeApp();
    
    // 8. Ensure manifest exists (fallback if metadata didn't add it)
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
      console.log('📝 Manifest injected programmatically');
    }
  }, []);

  return null; // Component doesn't render anything
}