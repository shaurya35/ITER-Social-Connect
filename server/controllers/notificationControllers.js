const {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
} = require("firebase/firestore");
const admin = require('firebase-admin');

const db = require("../firebase/firebaseConfig");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lastDocId, limit: limitParam = 20 } = req.query;
    const limitValue = parseInt(limitParam, 10);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const notificationsCollection = collection(db, "notifications");
    let notificationsQuery = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      orderBy("__name__"),
      limit(limitValue)
    );

    if (lastDocId) {
      const lastDocRef = doc(db, "notifications", lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      
      if (lastDocSnap.exists()) {
        notificationsQuery = query(notificationsQuery, startAfter(lastDocSnap));
      }
    }

    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    let lastVisible = null;
    const notifications = [];

    notificationsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      notifications.push({
        id: docSnapshot.id,
        type: data.type,
        message: data.message,
        senderId: data.senderId || null,
        senderName: data.senderName || "Unknown",
        senderProfilePicture: data.senderProfilePicture || "",
        timestamp: data.timestamp || null,
        date: data.timestamp ? new Date(data.timestamp) : new Date(),
        read: data.isRead || false,
        link: data.link || "",
        postId: data.postId || "",
      });
      lastVisible = docSnapshot;
    });

    const hasMore = notifications.length === limitValue;
    const nextLastDocId = hasMore && lastVisible ? lastVisible.id : null;

    res.status(200).json({ 
      notifications,
      hasMore,
      lastDocId: nextLastDocId
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    
    if (error.code === 'failed-precondition') {
      const indexUrl = error.message.match(/https:\/\/[^ ]+/)?.[0] || '';
      return res.status(400).json({ 
        error: "Index missing",
        solution: indexUrl
      });
    }
    
    res.status(500).json({ message: "Internal server error." });
  }
};

// New function to create notifications with push support
const createNotification = async (notificationData) => {
  try {
    const db = admin.firestore();
    
    const notification = {
      recipientId: notificationData.recipientId,
      senderId: notificationData.senderId,
      senderName: notificationData.senderName,
      senderProfilePicture: notificationData.senderProfilePicture || null,
      message: notificationData.message,
      type: notificationData.type,
      postId: notificationData.postId || null,
      date: admin.firestore.FieldValue.serverTimestamp(),
      pushed: false, // ← Important: Will be picked up by cron job
      read: false
    };
    
    const docRef = await db.collection('notifications').add(notification);
    console.log(`📝 Notification created: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  createNotification // Export this for use in other routes
};