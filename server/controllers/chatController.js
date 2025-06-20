const { sendMessage, getMessages } = require("../firebase/firebaseChat");

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
    const result = await sendMessage(chatId, { text, senderId });
    res.status(200).json({ status: "sent", result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

const fetchMessages = async (req, res) => {
  const senderId = req.user.userId;
  const { receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: "Missing senderId or receiverId" });
  }

  const chatId = generateChatId(senderId, receiverId);

  try {
    let messages = await getMessages(chatId);

    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json({ status: "ok", messages });
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = { postMessage, fetchMessages };
