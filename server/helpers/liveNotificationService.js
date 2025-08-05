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
  // 1) Ensure Admin SDK is initialized
  const adminApp = initFirebase();

  // 2) Lookup the recipient's FCM token in Firestore
  const userSnap = await getDoc(doc(db, "users", userId));
  if (!userSnap.exists()) return;

  const token = userSnap.data().fcmToken;
  if (!token) return;  // no device registered

  // 3) Build the FCM message
  const message = {
    token,
    notification: {
      title: opts.title,
      body:  opts.body,
    },
    data: opts.data || {},
  };

  // 4) Fire-and-forget send
  await adminApp.messaging().send(message);
}

module.exports = {
  pushNotification,
};
