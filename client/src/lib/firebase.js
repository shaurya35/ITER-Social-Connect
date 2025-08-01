import { initializeApp } from "firebase/app"
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getMessaging, isSupported } from "firebase/messaging"

// Add this at the top temporarily for debugging
console.log("🔍 Firebase Config Debug:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Loaded" : "❌ Missing",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Loaded" : "❌ Missing",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ Missing",
  // Don't log actual values for security
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// Initialize Messaging (only if supported and in browser)
export let messaging = null
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}

// Define firebaseEnabled - this was missing!
export const firebaseEnabled = true

// Enable Firestore local cache (IndexedDB)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("✅ Firestore persistence enabled (IndexedDB)")
    })
    .catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("⚠️ Firestore persistence failed: multiple tabs open")
      } else if (err.code === "unimplemented") {
        console.warn("⚠️ Firestore persistence not available in this browser")
      } else {
        console.error("❌ Firestore persistence error:", err)
      }
    })
}

// Connect to emulator in development (optional)
if (process.env.NODE_ENV === "development") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080)
  } catch (error) {
    console.log("Firestore emulator connection failed:", error)
  }
}

export default app
