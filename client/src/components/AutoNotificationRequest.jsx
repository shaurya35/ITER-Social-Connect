"use client"
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { FCMService } from '@/services/fcmService'

export default function AutoNotificationRequest() {
  const { accessToken } = useAuth();
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const requestPermission = async () => {
      // Only request if user is logged in and we haven't requested before
      if (accessToken && !requested && typeof window !== 'undefined') {
        setRequested(true);
        
        try {
          console.log("🔔 Requesting notification permission...");
          
          // Request permission automatically
          const permission = await Notification.requestPermission();
          console.log("Permission result:", permission);
          
          if (permission === "granted") {
            console.log("✅ Permission granted, initializing FCM...");
            await FCMService.initializeFCM(accessToken);
            console.log("✅ FCM initialized successfully");
          } else {
            console.log("❌ Permission denied or dismissed");
          }
        } catch (error) {
          console.error("❌ Notification setup failed:", error);
        }
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(requestPermission, 1000);
    
    return () => clearTimeout(timer);
  }, [accessToken, requested]);

  return null; // Invisible component
}