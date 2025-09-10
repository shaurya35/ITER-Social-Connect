"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import axios from "axios";
import { BACKEND_URL } from "@/configs";
import { useAuth } from "@/contexts/AuthProvider";

const FirebaseMessagingContext = createContext(null);

export function useFirebaseMessaging() {
  return useContext(FirebaseMessagingContext);
}

export function FirebaseMessagingProvider({ children }) {
  const { accessToken } = useAuth();
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    (async () => {
      try {
        if (!(await isSupported())) return;

        const app = initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });

        const messaging = getMessaging(app);

        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        // Avoid forced reload on controllerchange to reduce mobile flakiness

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (fcmToken) {
          await axios.post(
            `${BACKEND_URL}/api/notifications/register-token`,
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }

        onMessage(messaging, (payload) => {
          // Foreground handling only logs; do not show notification to avoid dupes
          console.log("Foreground push:", payload);
        });
      } catch (err) {
        console.error("FCM init error:", err);
      }
    })();
  }, [accessToken]);

  return (
    <FirebaseMessagingContext.Provider value={null}>
      {children}
    </FirebaseMessagingContext.Provider>
  );
}


