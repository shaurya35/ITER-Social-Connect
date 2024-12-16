import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import admin from "firebase-admin";

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}
export const auth = admin.auth();
