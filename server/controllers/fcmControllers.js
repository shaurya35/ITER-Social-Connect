const { doc, setDoc } = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const saveFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.userId;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User ID is required" });
    }

    const userTokenRef = doc(db, "fcmTokens", userId);

    await setDoc(
      userTokenRef,
      {
        userId,
        fcmToken,
        updatedAt: new Date().toISOString(),
        active: true,
      },
      { merge: true }
    );

    console.log(`✅ FCM token saved for user: ${userId}`);

    res.status(200).json({
      message: "FCM token saved successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({
      message: "Failed to save FCM token",
      error: error.message,
    });
  }
};
module.exports = {
  saveFCMToken,
};
