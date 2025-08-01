"use client"
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { FCMService } from '@/services/fcmService'

// Simple notification permission component
function NotificationPermission() {
  const { accessToken } = useAuth();

  useEffect(() => {
    const initNotifications = async () => {
      if (accessToken && typeof window !== 'undefined') {
        // Request permission automatically
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          await FCMService.initializeFCM(accessToken);
        }
      }
    };

    initNotifications();
  }, [accessToken]);

  return null; // Invisible component
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NotificationPermission />
        {children}
      </body>
    </html>
  )
}