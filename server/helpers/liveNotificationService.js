// services/notificationService.js
const { doc, getDoc } = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK once, using environment vars
function initFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin;
}

/**
 * Send an FCM push to a single user by their UID.
 *
 * @param {string} userId   – Firebase Auth UID of the recipient
 * @param {object} opts
 * @param {string} opts.title   – Notification title
 * @param {string} opts.body    – Notification body text
 * @param {object} [opts.data]  – Optional custom data payload
 */
async function pushNotification(userId, opts) {
  const firebaseAdmin = initFirebase();

  // 1) Fetch the user doc
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const fcmToken = userSnap.data().fcmToken;
  if (!fcmToken) return;  // no token to send to

  // 2) Build a DATA-ONLY message to avoid browser auto-notification (prevents duplicates)
  const message = {
    token: fcmToken,
    data: {
      title: String(opts.title || "Notification"),
      body: String(opts.body || "You have a new update"),
      ...(opts.data || {}),
    },
  };

  try {
    // 3) Attempt to send
    await firebaseAdmin.messaging().send(message);
  } catch (err) {
    console.error("FCM push error:", err);

    const code = err.errorInfo?.code;
    // 4) If token is no longer registered, remove it
    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      console.warn(`Removing stale FCM token for user ${userId}`);
      await updateDoc(userRef, { fcmToken: "" });
    }
  }
}
module.exports = {
  pushNotification,
};
