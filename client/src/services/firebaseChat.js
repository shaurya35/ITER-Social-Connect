import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  limit,
} from "firebase/firestore";

import { db, firebaseEnabled } from "@/lib/firebase";

export class FirebaseChatService {
  // ✅ Check if Firebase is available and enabled
  static isAvailable() {
    return firebaseEnabled && db;
  }

  // ✅ Send a message and update the conversation
  static async sendMessage(
    conversationId,
    senderId,
    receiverId,
    content,
    senderInfo = null
  ) {
    if (!this.isAvailable()) throw new Error("Firebase is not available");

    try {
      const messageData = {
        conversationId,
        senderId,
        receiverId,
        text: content,
        content,
        timestamp: serverTimestamp(),
        type: "text",
        seen: false,
        ...(senderInfo && {
          senderInfo,
          senderAvatar: senderInfo.avatar,
        }),
      };

      const messageRef = await addDoc(collection(db, "messages"), messageData);

      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          id: messageRef.id,
          content,
          text: content,
          senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return messageRef.id;
    } catch (error) {
      console.error("❌ Firebase: Error sending message:", error);
      throw error;
    }
  }

  // ✅ Create or get existing conversation between two users
  static async createOrGetConversation(user1, user2) {

    if (!this.isAvailable()) throw new Error("Firebase is not available");

    try {
      const conversationId = [user1.id, user2.id].sort().join("_");
      const conversationRef = doc(db, "conversations", conversationId);

      // Check if the conversation exists
      const snapshot = await getDocs(
        query(
          collection(db, "conversations"),
          where("participantIds", "array-contains", user1.id)
        )
      );

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (
          data.participantIds?.includes(user1.id) &&
          data.participantIds?.includes(user2.id)
        ) {
          return docSnap.id;
        }
      }

      // Create new conversation
      const conversationData = {
        participantIds: [user1.id, user2.id],
        participants: [
          {
            id: user1.id,
            name: user1.name,
            email: user1.email,
            avatar: user1.avatar,
            isOnline: user1.isOnline || false,
          },
          {
            id: user2.id,
            name: user2.name,
            email: user2.email,
            avatar: user2.avatar,
            isOnline: user2.isOnline || false,
          },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        unreadCount: 0,
      };

      await setDoc(conversationRef, conversationData);
      return conversationId;
    } catch (error) {
      console.error("❌ Firebase: Error creating conversation:", error);
      throw error;
    }
  }

  // ✅ Set up real-time message listener
  static setupMessageListener(conversationId, callback) {
    if (!this.isAvailable()) throw new Error("Firebase is not available");

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "desc"),
      limit(25)
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            timestamp:
              data.timestamp?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
          };
        });
        callback(messages);
      },
      (error) => {
        console.error("❌ Firebase: Message listener error:", error);
      }
    );
  }

  // ✅ Set up real-time conversation listener
  static setupConversationListener(userId, callback) {
    if (!this.isAvailable()) throw new Error("Firebase is not available");

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const conversations = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  timestamp:
                    data.lastMessage.timestamp?.toDate?.()?.toISOString() ||
                    new Date().toISOString(),
                }
              : null,
          };
        });
        callback(conversations);
      },
      (error) => {
        console.error("❌ Firebase: Conversation listener error:", error);
      }
    );
  }
}
