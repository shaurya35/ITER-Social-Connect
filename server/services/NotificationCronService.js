const cron = require('node-cron');
const admin = require('firebase-admin'); // Use the already initialized admin

class NotificationCronService {
  static startCronJobs() {
    console.log('🔄 Starting notification cron jobs...');
    
    // Run every 1 minute to check for new notifications
    cron.schedule('* * * * *', async () => {
      console.log('⏰ Checking for new notifications to push...');
      await this.checkAndSendNotifications();
    });
  }

  static async checkAndSendNotifications() {
    try {
      const db = admin.firestore();
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      
      // Find notifications created in the last minute that haven't been pushed
      const newNotificationsSnapshot = await db.collection('notifications')
        .where('date', '>', oneMinuteAgo)
        .where('pushed', '==', false)
        .get();

      if (newNotificationsSnapshot.empty) {
        console.log('📭 No new notifications to push');
        return;
      }

      console.log(`📬 Found ${newNotificationsSnapshot.size} new notifications to push`);

      // Process each notification directly (without PushNotificationService)
      const notificationPromises = newNotificationsSnapshot.docs.map(async (notificationDoc) => {
        const notification = notificationDoc.data();
        const notificationId = notificationDoc.id;
        
        // Send notification directly using admin.messaging()
        const success = await this.sendPushNotification(notification.recipientId, {
          title: this.getNotificationTitle(notification.type),
          body: `${notification.senderName} ${notification.message}`,
          data: {
            type: notification.type,
            postId: notification.postId || '',
            senderId: notification.senderId || ''
          }
        });
        
        // Mark as pushed if successful
        if (success) {
          await notificationDoc.ref.update({ 
            pushed: true,
            pushedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        return success;
      });

      const results = await Promise.allSettled(notificationPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      console.log(`✅ Pushed ${successful}/${newNotificationsSnapshot.size} notifications successfully`);

    } catch (error) {
      console.error('❌ Error in notification cron job:', error);
    }
  }

  static async sendPushNotification(userId, notificationData) {
    try {
      const db = admin.firestore();
      
      // Get user's FCM tokens
      const tokensSnapshot = await db.collection('fcm_tokens')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      if (tokensSnapshot.empty) {
        console.log(`📱 No active FCM tokens for user ${userId}`);
        return false;
      }

      const tokens = tokensSnapshot.docs.map(doc => doc.data().fcmToken);
      
      // Create push notification payload
      const message = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: '/icon-192x192.png'
        },
        data: notificationData.data,
        tokens: tokens
      };

      // Send the notification
      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`✅ Push notification sent to ${response.successCount}/${tokens.length} devices for user ${userId}`);
      
      return response.successCount > 0;

    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  static getNotificationTitle(type) {
    const titles = {
      'connection_request': '🤝 New Connection Request',
      'comment': '💬 New Comment',
      'like': '❤️ New Like',
      'message': '📨 New Message',
      'event': '📅 Event Update',
      'post': '📝 New Post'
    };
    return titles[type] || '🔔 New Notification';
  }
}

module.exports = NotificationCronService;