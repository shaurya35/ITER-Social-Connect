import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
require("dotenv").config();


const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
