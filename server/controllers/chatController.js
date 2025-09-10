const {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const { pushNotification } = require("../helpers/liveNotificationService");

// Get conversations for user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const conversations = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const otherParticipant = data.participants?.find((p) => p.id !== userId);

      if (otherParticipant) {
        let lastMessage = null;
        if (data.lastMessage) {
          lastMessage = data.lastMessage;
        } else {
          try {
            const messagesQuery = query(
              collection(db, "messages"),
              where("conversationId", "==", docSnapshot.id),
              orderBy("timestamp", "desc")
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            if (!messagesSnapshot.empty) {
              const latestMessageDoc = messagesSnapshot.docs[0];
              const latestMessageData = latestMessageDoc.data();
              lastMessage = latestMessageData.text || latestMessageData.content;
            }
          } catch (messageError) {}
        }

        const conversation = {
          id: docSnapshot.id,
          chatId: data.chatId || `chat_${userId}_${otherParticipant.id}`,
          user: {
            _id: otherParticipant.id,
            name: otherParticipant.name || "Unknown User",
            email:
              otherParticipant.email ||
              `${
                otherParticipant.name?.toLowerCase().replace(/\s+/g, "") ||
                "user"
              }@example.com`,
            avatar: otherParticipant.avatar || null,
          },
          lastMessage: lastMessage,
          timestamp: data.updatedAt ||
            data.createdAt || { seconds: Date.now() / 1000 },
          participantIds: data.participantIds || [userId, otherParticipant.id],
        };

        conversations.push(conversation);
      }
    }

    res.json({
      status: "ok",
      conversations: conversations,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { receiverId } = req.query;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }

    const q1 = query(
      collection(db, "messages"),
      where("senderId", "==", userId),
      where("receiverId", "==", receiverId),
      where("isDeleted", "==", false)
    );

    const q2 = query(
      collection(db, "messages"),
      where("senderId", "==", receiverId),
      where("receiverId", "==", userId),
      where("isDeleted", "==", false)
    );

    let snapshot1, snapshot2;
    try {
      [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    } catch (firebaseError) {
      return res.status(500).json({
        error: "Database query failed",
        details: firebaseError.message,
      });
    }

    const messages = [];

    [...snapshot1.docs, ...snapshot2.docs].forEach((doc) => {
      try {
        const data = doc.data();
        if (!data) return;

        messages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.content || data.text,
          timestamp: data.timestamp,
          type: data.type || "text",
          isRead: data.isRead || false,
        });
      } catch (docError) {}
    });

    messages.sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeA - timeB;
    });

    const userInfo = {
      id1: userId,
      id2: receiverId,
      id1Avatar: null,
      id2Avatar: null,
    };

    try {
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, "users", userId)),
        getDoc(doc(db, "users", receiverId)),
      ]);

      if (user1Doc.exists()) {
        const user1Data = user1Doc.data();
        userInfo.id1Avatar = user1Data.profilePicture || user1Data.avatar;
      }

      if (user2Doc.exists()) {
        const user2Data = user2Doc.data();
        userInfo.id2Avatar = user2Data.profilePicture || user2Data.avatar;
      }
    } catch (userError) {}

    res.json({
      status: "ok",
      messages: messages,
      userInfo: userInfo,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.userId || req.user?.id;
    const { receiverId, text } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const senderDoc = await getDoc(doc(db, "users", senderId));
    const senderData = senderDoc.exists() ? senderDoc.data() : {};

    const receiverDoc = await getDoc(doc(db, "users", receiverId));
    const receiverData = receiverDoc.exists() ? receiverDoc.data() : {};

    const messageData = {
      senderId,
      receiverId,
      text: text.trim(),
      content: text.trim(),
      timestamp: serverTimestamp(),
      type: "text",
      isRead: false,
      isDeleted: false,
      senderName: senderData.name || "Unknown User",
      senderAvatar: senderData.profilePicture || senderData.avatar || null,
    };

    const messageRef = await addDoc(collection(db, "messages"), messageData);

    const conversationId = [senderId, receiverId].sort().join("_");
    const conversationRef = doc(db, "conversations", conversationId);

    try {
      await updateDoc(conversationRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      const conversationData = {
        id: conversationId,
        participantIds: [senderId, receiverId],
        participants: [
          {
            id: senderId,
            name: senderData.name || "Unknown User",
            email: senderData.email || `${senderId}@example.com`,
            avatar: senderData.profilePicture || senderData.avatar || null,
          },
          {
            id: receiverId,
            name: receiverData.name || "Unknown User",
            email: receiverData.email || `${receiverId}@example.com`,
            avatar: receiverData.profilePicture || receiverData.avatar || null,
          },
        ],
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      await addDoc(collection(db, "conversations"), conversationData);
    }

    try {
      const broadcastData = {
        type: "new_message",
        conversationId: receiverId,
        senderId: senderId,
        receiverId: receiverId,
        content: text.trim(),
        messageId: messageRef.id,
        timestamp: new Date().toISOString(),
        senderName: senderData.name || "Unknown User",
        senderAvatar: senderData.profilePicture || senderData.avatar || null,
      };

      console.log("📤 Broadcasting message via WebSocket:", broadcastData);

      // Broadcast to WebSocket clients
      if (global.wss) {
        let sentCount = 0;
        global.wss.clients.forEach((client) => {
          if (client.readyState === 1 && client.userId) {
            // Send to both sender and receiver
            if (client.userId === senderId || client.userId === receiverId) {
              try {
                client.send(JSON.stringify(broadcastData));
                sentCount++;
                console.log(`📤 Message sent to user ${client.userId}`);
              } catch (error) {
                console.error("Error sending WebSocket message:", error);
              }
            }
          }
        });
        console.log(`📤 Message broadcasted to ${sentCount} clients`);
      } else {
        console.warn("⚠️ WebSocket server not available for broadcasting");
      }
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }

    // In-app and push notification for receiver
    try {
      if (receiverId !== senderId) {
        const preview = text.trim().slice(0, 80);
        const notificationRef = doc(collection(db, "notifications"));
        await setDoc(notificationRef, {
          userId: receiverId,
          senderId: senderId,
          senderName: senderData.name || "Unknown",
          senderProfilePicture: senderData.profilePicture || senderData.avatar || "",
          message: `New message from ${senderData.name || "Someone"}: "${preview}"`,
          timestamp: Date.now(),
          isRead: false,
          type: "chat_message",
          link: "/chat",
        });

        // Mobile/web push
        pushNotification(receiverId, {
          title: `New message from ${senderData.name || "Someone"}`,
          body: preview,
          data: { type: "chat_message", url: "/chat", senderId },
        });
      }
    } catch (notifyErr) {
      // Silent failure for notifications
    }

    res.json({
      status: "sent",
      result: {
        senderId,
        receiverId,
        text: text.trim(),
        timestamp: { seconds: Date.now() / 1000 },
        senderName: senderData.name || "Unknown User",
        senderAvatar: senderData.profilePicture || senderData.avatar || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query: searchQuery } = req.query;
    const currentUserId = req.user?.userId || req.user?.id;

    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      const userName = userData.name || "";
      const userEmail = userData.email || "";

      if (
        doc.id !== currentUserId &&
        (userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        users.push({
          _id: doc.id,
          name: userData.name || "Unknown User",
          email: userData.email || `${doc.id}@example.com`,
          avatar: userData.profilePicture || userData.avatar || null,
          about: userData.about || userData.bio || "",
        });
      }
    });

    res.json({
      status: "ok",
      users: users.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to search users" });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const createdBy = req.user?.userId || req.user?.id;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds)) {
      return res
        .status(400)
        .json({ error: "participantIds array is required" });
    }

    if (!participantIds.includes(createdBy)) {
      participantIds.push(createdBy);
    }

    const participants = [];
    for (const id of participantIds) {
      const userDoc = await getDoc(doc(db, "users", id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        participants.push({
          id,
          name: userData.name || "Unknown User",
          email: userData.email || `${id}@example.com`,
          avatar: userData.profilePicture || userData.avatar || null,
        });
      }
    }

    const conversationData = {
      participants,
      participantIds,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      isActive: true,
    };

    const docRef = await addDoc(
      collection(db, "conversations"),
      conversationData
    );

    res.json({
      status: "ok",
      conversationId: docRef.id,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
};
