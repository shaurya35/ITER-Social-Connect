const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: "/ws",
    });

    this.clients = new Map(); // userId -> WebSocket connection
    this.rooms = new Map(); // conversationId -> Set of userIds

    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on("connection", (ws, req) => {
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "WebSocket connection established",
          timestamp: new Date().toISOString(),
        })
      );

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch {}
      });

      ws.on("close", () => {
        this.handleDisconnection(ws);
      });

      ws.on("error", () => {});
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case "join":
        this.handleUserJoin(ws, data);
        break;
      case "join_conversation":
        this.handleJoinConversation(ws, data);
        break;
      case "typing_start":
        this.handleTypingStart(ws, data);
        break;
      case "typing_stop":
        this.handleTypingStop(ws, data);
        break;
      case "new_message":
        this.handleNewMessage(ws, data);
        break;
      default:
        break;
    }
  }

  handleUserJoin(ws, data) {
    const { userId, userInfo } = data;
    if (!userId) return;

    ws.userId = userId;
    ws.userInfo = userInfo;
    this.clients.set(userId, ws);

    ws.send(
      JSON.stringify({
        type: "joined",
        userId: userId,
        message: "Successfully joined WebSocket",
        timestamp: new Date().toISOString(),
      })
    );

    this.broadcastToOthers(userId, {
      type: "user_online",
      userId: userId,
      userInfo: userInfo,
      timestamp: new Date().toISOString(),
    });
  }

  handleJoinConversation(ws, data) {
    const { conversationId } = data;
    const userId = ws.userId;
    if (!userId || !conversationId) return;

    if (!this.rooms.has(conversationId)) {
      this.rooms.set(conversationId, new Set());
    }
    this.rooms.get(conversationId).add(userId);
  }

  handleTypingStart(ws, data) {
    const { conversationId } = data;
    const userId = ws.userId;
    if (!userId || !conversationId) return;

    this.broadcastToConversation(conversationId, userId, {
      type: "typing_start",
      userId: userId,
      conversationId: conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  handleTypingStop(ws, data) {
    const { conversationId } = data;
    const userId = ws.userId;
    if (!userId || !conversationId) return;

    this.broadcastToConversation(conversationId, userId, {
      type: "typing_stop",
      userId: userId,
      conversationId: conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  handleNewMessage(ws, data) {
    const { conversationId, content, messageId } = data;
    const userId = ws.userId;
    if (!userId || !conversationId || !content) return;

    this.broadcastToConversation(conversationId, userId, {
      type: "new_message",
      userId: userId,
      conversationId: conversationId,
      content: content,
      messageId: messageId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnection(ws) {
    const userId = ws.userId;
    if (userId) {
      this.clients.delete(userId);

      this.rooms.forEach((users, conversationId) => {
        users.delete(userId);
        if (users.size === 0) {
          this.rooms.delete(conversationId);
        }
      });

      this.broadcastToOthers(userId, {
        type: "user_offline",
        userId: userId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  broadcastToOthers(excludeUserId, message) {
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastToConversation(conversationId, excludeUserId, message) {
    const room = this.rooms.get(conversationId);
    if (!room) return;

    room.forEach((userId) => {
      if (userId !== excludeUserId) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    });
  }

  sendMessageToConversation(conversationId, senderId, messageData) {
    this.broadcastToConversation(conversationId, senderId, {
      type: "new_message",
      ...messageData,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = WebSocketServer;
