import { db } from "../utils/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

export const saveMessage = async (
  roomId: string,
  senderId: string,
  message: string
) => {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  return await addDoc(messagesRef, {
    senderId,
    message,
    timestamp: new Date(),
  });
};

export const getMessages = async (roomId: string) => {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};
