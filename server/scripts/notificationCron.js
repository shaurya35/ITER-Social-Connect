const cron = require("node-cron");
const { adminDb } = require("../firebase/firebaseAdmin");
const PushNotificationService = require("../services/pushNotificationService");

class NotificationCron {
  static lastCheckTime = new Date();

  static async checkAndSendNotifications() {
    try {
      console.log("🔍 Checking for new notifications...");
      
      const currentTime = new Date();
      const checkTime = new Date(this.lastCheckTime);

      // Query notifications created since last check
      const notificationsQuery = adminDb
        .collection("notifications")
        .where("timestamp", ">", checkTime)
        .orderBy("timestamp", "desc");

      const snapshot = await notificationsQuery.get();

      if (snapshot.empty) {
        console.log("📭 No new notifications found");
        this.lastCheckTime = currentTime;
        return;
      }

      console.log(`📬 Found ${snapshot.size} new notifications`);

      // Group notifications by user
      const userNotifications = new Map();

      snapshot.forEach((doc) => {
        const notification = doc.data();
        const userId = notification.userId;

        if (!userNotifications.has(userId)) {
          userNotifications.set(userId, []);
        }

        userNotifications.get(userId).push({
          id: doc.id,
          ...notification,
        });
      });

      // Send push notifications
      const pushPromises = [];
      
      for (const [userId, notifications] of userNotifications) {
        // Send latest notification (or customize logic)
        const latestNotification = notifications[0];
        
        const notificationPayload = {
          id: latestNotification.id,
          title: this.getNotificationTitle(latestNotification),
          body: this.getNotificationBody(latestNotification),
          type: latestNotification.type || "general",
        };

        pushPromises.push({
          userId,
          notification: notificationPayload,
        });
      }

      // Send all notifications
      if (pushPromises.length > 0) {
        await PushNotificationService.sendBulkNotifications(pushPromises);
      }

      this.lastCheckTime = currentTime;
      console.log("✅ Notification check completed");

    } catch (error) {
      console.error("❌ Error in notification cron:", error);
    }
  }

  static getNotificationTitle(notification) {
    switch (notification.type) {
      case "connection_request":
        return "New Connection Request";
      case "comment":
        return "New Comment";
      case "like":
        return "Post Liked";
      case "event":
        return "New Event";
      default:
        return "New Notification";
    }
  }

  static getNotificationBody(notification) {
    const senderName = notification.senderName || "Someone";
    
    switch (notification.type) {
      case "connection_request":
        return `${senderName} sent you a connection request`;
      case "comment":
        return `${senderName} commented on your post`;
      case "like":
        return `${senderName} liked your post`;
      case "event":
        return `${senderName} created a new event`;
      default:
        return notification.message || "You have a new notification";
    }
  }

  static start() {
    console.log("🚀 Starting notification cron job...");
    
    // Run every 30 seconds (adjust as needed)
    cron.schedule("*/30 * * * * *", () => {
      this.checkAndSendNotifications();
    });

    // Run immediately on start
    this.checkAndSendNotifications();
  }
}

module.exports = NotificationCron;