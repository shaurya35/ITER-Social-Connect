const {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from request query
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc") // Order by timestamp in descending order
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);

    const notifications = notificationsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        type: data.type,
        message: data.message,
        date: new Date(data.timestamp), // Convert timestamp to Date object
        read: data.isRead || false, // Mark read/unread
      };
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getNotifications,
};
