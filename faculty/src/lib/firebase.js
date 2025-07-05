

import { initializeApp } from "firebase/app"
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

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

// ✅ Enable Firestore local cache (IndexedDB)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("✅ Firestore persistence enabled (IndexedDB)")
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("⚠️ Firestore persistence failed: multiple tabs open")
    } else if (err.code === "unimplemented") {
      console.warn("⚠️ Firestore persistence not supported in this browser")
    } else {
      console.error("❌ Firestore persistence error:", err)
    }
  })

// Initialize Auth
export const auth = getAuth(app)

// Connect to emulator in development (optional)
if (process.env.NODE_ENV === "development") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080)
  } catch (error) {
    console.log("Firestore emulator connection failed:", error)
  }
}

export default app
