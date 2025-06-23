// firebase/firebaseChat.js
const db = require("../firebase/firebaseConfig.js");
const {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} = require("firebase/firestore");

const sendMessage = async (chatId, { text, senderId, receiverId }) => {
  const messagesRef = collection(db, `messages/${chatId}/chats`);
  const timestamp = Timestamp.now();

  const messageData = {
    text,
    senderId,
    receiverId,
    timestamp,
  };

  await addDoc(messagesRef, messageData);

  // Store/update summary in conversations collection
  const conversationRef = doc(db, "conversations", chatId);
  await setDoc(conversationRef, {
    chatId,
    userIds: [senderId, receiverId],
    lastMessage: text,
    timestamp,
    senderId,
    receiverId,
  });

  return messageData;
};

const getMessages = async (chatId) => {
  const messagesRef = collection(db, `messages/${chatId}/chats`);
  const q = query(messagesRef, orderBy("timestamp"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

const getConversations = async (userId) => {
  const convRef = collection(db, "conversations");
  const q = query(
    convRef,
    where("userIds", "array-contains", userId),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
};
