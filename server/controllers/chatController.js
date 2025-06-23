const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../firebase/firebaseChat");
const {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

const generateChatId = (userId1, userId2) => {
  return [userId1, userId2].sort().join("_");
};

const postMessage = async (req, res) => {
  const senderId = req.user.userId;
  const { receiverId, text } = req.body;

  if (!senderId || !receiverId || !text) {
    return res
      .status(400)
      .json({ error: "Missing senderId, receiverId, or text" });
  }

  const chatId = generateChatId(senderId, receiverId);

  try {
    const result = await sendMessage(chatId, { text, senderId, receiverId });
    res.status(200).json({ status: "sent", result });
  } catch (error) {
    console.error("Error in postMessage:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

const fetchMessages = async (req, res) => {
  const id1 = req.user.userId; // current logged-in user
  const { receiverId: id2 } = req.query; // user to chat with

  if (!id1 || !id2) {
    return res.status(400).json({ error: "Missing id1 or id2" });
  }

  const chatId = generateChatId(id1, id2);

  try {
    const messages = await getMessages(chatId);

    messages.sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || new Date(0);
      const timeB = b.timestamp?.toDate?.() || new Date(0);
      return timeA - timeB;
    });

    // Fetch user profile pictures
    const [id1Snap, id2Snap] = await Promise.all([
      getDoc(doc(db, "users", id1)),
      getDoc(doc(db, "users", id2)),
    ]);

    const id1Avatar = id1Snap.exists()
      ? id1Snap.data().profilePicture || null
      : null;
    const id2Avatar = id2Snap.exists()
      ? id2Snap.data().profilePicture || null
      : null;

    res.status(200).json({
      status: "ok",
      userInfo: {
        id1,
        id2,
        id1Avatar,
        id2Avatar,
      },
      messages,
    });
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

const fetchUserConversations = async (req, res) => {
  const currentUserId = req.user.userId;

  try {
    const conversations = await getConversations(currentUserId);

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.userIds.find((id) => id !== currentUserId);
        const userDocRef = doc(db, "users", otherUserId);
        const userDocSnap = await getDoc(userDocRef);

        let userData = {};
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          userData = {
            _id: otherUserId,
            name: data.name,
            avatar: data.profilePicture || null,
            username: data.username,
          };
        }

        return {
          chatId: conv.chatId,
          lastMessage: conv.lastMessage,
          timestamp: conv.timestamp,
          user: userData,
        };
      })
    );

    res
      .status(200)
      .json({ status: "ok", conversations: enrichedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;
    const loggedInUserId = req.user?.userId;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search query cannot be empty" });
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();

    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const matchingUsers = usersSnapshot.docs
      .map((doc) => ({
        _id: doc.id,
        name: doc.data().name,
        username: doc.data().username,
        avatar: doc.data().profilePicture || null,
        about: doc.data().about || "",
      }))
      .filter(
        (user) =>
          user._id !== loggedInUserId &&
          user.name?.toLowerCase().includes(normalizedQuery)
      );

    res.status(200).json({
      status: "ok",
      users: matchingUsers,
    });
  } catch (error) {
    console.error("Failed to search users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

module.exports = {
  postMessage,
  fetchMessages,
  fetchUserConversations,
  searchUsers,
};
