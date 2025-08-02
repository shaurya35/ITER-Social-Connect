"use client"
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { FCMService } from '@/services/fcmService'

export default function AutoNotificationRequest() {
  const { accessToken } = useAuth()
  const [requested, setRequested] = useState(false)

  // Add this to see if component mounts
  console.log("🚀 AutoNotificationRequest component rendered")
  console.log("🚀 AccessToken:", !!accessToken)

  useEffect(() => {
    console.log("🔧 AutoNotificationRequest useEffect triggered")
    console.log("🔧 AccessToken available:", !!accessToken)
    console.log("🔧 Window available:", typeof window !== 'undefined')
    console.log("🔧 Notification API available:", typeof Notification !== 'undefined')

    const requestPermission = async () => {
      console.log("🔔 requestPermission function called")
      console.log("🔔 Conditions check:")
      console.log("  - accessToken:", !!accessToken)
      console.log("  - requested:", requested)
      console.log("  - window:", typeof window !== 'undefined')
      
      if (accessToken && !requested && typeof window !== 'undefined') {
        setRequested(true)
        console.log("🔔 Attempting to request notification permission...")

        try {
          // Check current permission status
          console.log("Current permission:", Notification.permission)

          if (Notification.permission === 'default') {
            console.log("🔔 Requesting permission...")
            const permission = await Notification.requestPermission()
            console.log("✅ Permission result:", permission)

            if (permission === "granted") {
              console.log("🎉 Permission granted! Initializing FCM...")
              await FCMService.initializeFCM(accessToken)
            }
          } else if (Notification.permission === 'granted') {
            console.log("🎉 Permission already granted! Initializing FCM...")
            await FCMService.initializeFCM(accessToken)
          } else {
            console.log("❌ Permission previously denied")
          }
        } catch (error) {
          console.error("❌ Error requesting permission:", error)
        }
      } else {
        console.log("🚫 Conditions not met for permission request")
      }
    }

    requestPermission()
  }, [accessToken, requested])

  return null
}