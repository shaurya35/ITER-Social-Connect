import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase"; // Should work now with export fix

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

class FCMService {
  static async checkNotificationPermission() {
    if (typeof window === "undefined") return false;
    
    if (Notification.permission === "granted") {
      console.log("✅ Notification permission granted");
      return true;
    } else if (Notification.permission === "default") {
      console.log("🔔 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } else {
      console.log("❌ Notification permission denied");
      return false;
    }
  }

  static async getFCMToken() {
    try {
      if (typeof window === "undefined") return null;

      const messaging = getMessaging(app);
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log("📱 FCM Token generated:", currentToken.substring(0, 20) + "...");
        return currentToken;
      } else {
        console.log("❌ No registration token available");
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  // NEW: Store token in backend
  static async storeTokenInBackend(token, accessToken) {
    try {
      console.log("📤 Sending FCM token to backend...");
      
      const response = await fetch(`${BACKEND_URL}/api/fcm/store-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          fcmToken: token,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ FCM token stored successfully:", result);
        return true;
      } else {
        console.error("❌ Failed to store FCM token:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error storing FCM token:", error);
      return false;
    }
  }

  static async initializeFCM(accessToken) {
    try {
      console.log("🔧 Initializing FCM...");
      
      const hasPermission = await this.checkNotificationPermission();
      if (!hasPermission) {
        console.log("❌ No notification permission");
        return false;
      }

      const token = await this.getFCMToken();
      if (!token) {
        console.log("❌ Failed to get FCM token");
        return false;
      }

      // Store token in backend
      const stored = await this.storeTokenInBackend(token, accessToken);
      if (!stored) {
        console.log("⚠️ FCM token generated but not stored in backend");
      }

      this.setupMessageListener();
      
      console.log("✅ FCM initialization completed");
      return true;
      
    } catch (error) {
      console.error("❌ FCM initialization failed:", error);
      return false;
    }
  }

  static setupMessageListener() {
    if (typeof window === "undefined") return;

    const messaging = getMessaging(app);
    
    onMessage(messaging, (payload) => {
      console.log("📨 Message received (foreground):", payload);
      
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192x192.png'
        });
      }
    });
  }
}

export { FCMService };