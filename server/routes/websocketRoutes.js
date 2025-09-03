const express = require("express")
const router = express.Router()

let wsServer = null

function setWebSocketServer(server) {
  wsServer = server
}

router.post("/broadcast", (req, res) => {
  try {
    const { type, conversationId, senderId, receiverId, content, messageId, timestamp } = req.body

    if (!wsServer) {
      return res.status(503).json({ error: "WebSocket server not available" })
    }



    wsServer.clients.forEach((client) => {
      if (client.readyState === 1) {
        try {
          client.send(
            JSON.stringify({
              type: "new_message",
              conversationId,
              senderId,
              receiverId,
              content,
              messageId,
              timestamp,
            }),
          )
        } catch (error) {
          console.error("❌ Error sending to WebSocket client:", error)
        }
      }
    })

    res.json({ success: true, message: "Broadcast sent" })
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast message" })
  }
})

module.exports = { router, setWebSocketServer }
