"use client";
import { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Determine API URL based on environment
        const isDev = process.env.NODE_ENV === 'development';
        const apiBaseUrl = isDev ? 'http://localhost:5000' : process.env.NEXT_PUBLIC_PROD_API_URL;
        
        // 2. Fetch Firebase config from Express server
        const response = await fetch(`${apiBaseUrl}/api/firebase-config`);
        const firebaseConfig = await response.json();
        
        // 3. Initialize Firebase
        const firebaseApp = firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();
        
        // 4. Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered');
          
          // 5. Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('🔥 Service Worker is ready');
          
          // 6. Send config to service worker
          registration.active?.postMessage({
            type: 'INIT_FIREBASE',
            config: firebaseConfig
          });
          
          // 7. Request notification permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const token = await messaging.getToken();
            console.log('🔑 FCM Token:', token);
            // Send token to your backend
            await fetch(`${apiBaseUrl}/api/store-fcm-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
          }
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return null;
}