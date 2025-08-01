import { getToken, onMessage } from "firebase/messaging"
import { messaging } from "@/lib/firebase"

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export class FCMService {
  static async requestPermission() {
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        console.log("✅ Notification permission granted")
        return true
      } else {
        console.warn("❌ Notification permission denied")
        return false
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }

  static async getFCMToken() {
    try {
      if (!messaging) {
        console.warn("Firebase messaging not supported")
        return null
      }

      if (!VAPID_KEY) {
        console.error("❌ VAPID key not found in environment variables")
        return null
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      })

      if (token) {
        console.log("✅ FCM Token retrieved:", token)
        return token
      } else {
        console.warn("❌ No FCM token available")
        return null
      }
    } catch (error) {
      console.error("Error getting FCM token:", error)
      return null
    }
  }

  static async initializeFCM(accessToken) {
    try {
      const hasPermission = await this.requestPermission()
      if (!hasPermission) return false

      const token = await this.getFCMToken()
      if (!token) return false

      console.log("✅ FCM initialized successfully")
      return true
    } catch (error) {
      console.error("Error initializing FCM:", error)
      return false
    }
  }
}