const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // For Vercel/Production: Use environment variable
  // For Local: Use service account file
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production: Parse from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Local development: Use file
    serviceAccount = require(path.join(__dirname, "service-account-key.json"));
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.projectId || process.env.FIREBASE_PROJECT_ID,
  });
}

const messaging = admin.messaging();
const adminDb = admin.firestore();

module.exports = { admin, messaging, adminDb };