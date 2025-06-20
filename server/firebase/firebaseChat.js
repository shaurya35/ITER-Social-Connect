const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");
const path = require("path");

const BASE_URL = `https://firestore.googleapis.com/v1/projects/social-connect-iter/databases/(default)/documents`;

async function getBearerToken() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, "serviceAccount.json"),
    scopes: "https://www.googleapis.com/auth/datastore",
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

async function sendMessage(chatId, { text, senderId }) {
  const token = await getBearerToken();
  const url = `${BASE_URL}/chats/${chatId}/messages`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const data = {
    fields: {
      text: { stringValue: text },
      senderId: { stringValue: senderId },
      timestamp: { timestampValue: new Date().toISOString() },
    },
  };

  const res = await axios.post(url, data, { headers });
  return res.data;
}

async function getMessages(chatId) {
  const token = await getBearerToken();
  const url = `${BASE_URL}/chats/${chatId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const res = await axios.get(url, { headers });
  const docs = res.data.documents || [];

  return docs.map((doc) => {
    const f = doc.fields;
    return {
      text: f.text.stringValue,
      senderId: f.senderId.stringValue,
      timestamp: f.timestamp.timestampValue,
    };
  });
}

module.exports = { sendMessage, getMessages };
