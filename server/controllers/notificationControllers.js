const {
  collection,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const admin = require("firebase-admin");

// function initFirebase() {
//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//       }),
//     });
//   }
//   return admin;
// }

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

// const sendFCMNotification = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { title, body, url } = req.body;
//     if (!userId || !title || !body) {
//       return res
//         .status(400)
//         .json({ message: "userId, title, and body are required." });
//     }

//     // fetch user token
//     const userRef = doc(db, "users", userId);
//     const userDoc = await getDoc(userRef);
//     if (!userDoc.exists() || !userDoc.data().fcmToken) {
//       return res.status(404).json({ message: "User token not found." });
//     }

//     // build and send
//     const payload = {
//       notification: { title, body },
//       data: { url: url || "/" },
//       token: userDoc.data().fcmToken,
//     };
//     const firebaseAdmin = initFirebase();
//     await firebaseAdmin.messaging().send(payload);

//     res.status(200).json({ message: "Notification sent." });
//   } catch (error) {
//     console.error("FCM Error:", error);
//     res.status(500).json({ message: "Notification failed." });
//   }
// };

// POST /api/notifications/register-token
const registerFCMToken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ message: "User ID and token are required." });
    }

    await updateDoc(doc(db, "users", userId), { fcmToken: token });
    res.status(200).json({ message: "Token registered successfully." });
  } catch (error) {
    console.error("Token registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getNotifications,
  // sendFCMNotification,
  registerFCMToken
};