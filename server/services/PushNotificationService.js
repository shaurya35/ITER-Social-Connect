const { messaging, adminDb } = require("../firebase/firebaseAdmin");

class PushNotificationService {
  static async sendNotificationToUser(userId, notification) {
    try {
      // Get user's FCM token
      const tokenDoc = await adminDb.collection("fcmTokens").doc(userId).get();
      
      if (!tokenDoc.exists) {
        console.log(`No FCM token found for user: ${userId}`);
        return false;
      }

      const { fcmToken, active } = tokenDoc.data();
      
      if (!active || !fcmToken) {
        console.log(`Inactive or invalid FCM token for user: ${userId}`);
        return false;
      }

      // Prepare notification payload
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title || "New Notification",
          body: notification.body || "You have a new notification",
          icon: "/android-192x192.png",
        },
        data: {
          notificationId: notification.id || "default",
          type: notification.type || "general",
          url: `/notifications`,
          userId: userId,
        },
        android: {
          notification: {
            channelId: "default",
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        webpush: {
          notification: {
            icon: "/android-192x192.png",
            badge: "/android-192x192.png",
            requireInteraction: true,
            actions: [
              {
                action: "open",
                title: "Open App"
              },
              {
                action: "dismiss", 
                title: "Dismiss"
              }
            ]
          },
        },
      };

      // Send the notification
      const response = await messaging.send(message);
      console.log(`✅ Push notification sent to user ${userId}:`, response);
      
      return true;
    } catch (error) {
      console.error(`❌ Error sending push notification to user ${userId}:`, error);
      
      // Handle invalid token errors
      if (error.code === "messaging/registration-token-not-registered" || 
          error.code === "messaging/invalid-registration-token") {
        // Mark token as inactive
        await adminDb.collection("fcmTokens").doc(userId).update({ active: false });
        console.log(`Marked FCM token as inactive for user: ${userId}`);
      }
      
      return false;
    }
  }

  static async sendBulkNotifications(userNotifications) {
    const results = await Promise.allSettled(
      userNotifications.map(({ userId, notification }) => 
        this.sendNotificationToUser(userId, notification)
      )
    );

    const successful = results.filter(result => result.status === "fulfilled" && result.value).length;
    const failed = results.length - successful;

    console.log(`📊 Bulk notifications sent: ${successful} successful, ${failed} failed`);
    
    return { successful, failed };
  }
}

module.exports = PushNotificationService;