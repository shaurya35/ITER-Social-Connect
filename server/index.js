const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      "in",
      tokens["response-time"](req, res) + "ms",
    ].join(" ");
  })
);

const allowedOrigins = [
  "http://localhost:3000",
  "capacitor://localhost",
  "http://itersocialconnect.vercel.app",
  "https://itersocialconnect.vercel.app",
  "http://iterconnect.vercel.app",
  "https://iterconnect.vercel.app",
  "http://www.iterconnect.vercel.app",
  "https://www.iterconnect.vercel.app",
  // "http://admin-itersocialconnect.vercel.app/",
  // "https://admin-itersocialconnect.vercel.app/",
  "http://iterconnect.live",
  "https://iterconnect.live",
  "http://www.iterconnect.live",
  "https://www.iterconnect.live",
  "https://client-check.vercel.app",
  "http://client-check.vercel.app",
  "https://www.client-check.vercel.app",
  "http://www.client-check.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Set-Cookie");
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use((err, req, res, next) => {
  if (err instanceof Error && err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "CORS not allowed for this origin" });
  } else if (err instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid JSON payload" });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// logger
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} host:${req.headers.host}`);
  next();
});


app.get("/", (req, res) => {
  res.json("Test API!!");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    websocket: {
      connected: wss.clients.size,
      path: "/ws"
    }
  });
});

const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingRoutes = require("./routes/settingRoutes");
const searchRoutes = require("./routes/searchRoutes");
const reportRoutes = require("./routes/reportRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const filterRoutes = require("./routes/filterRoutes");
const chatRoutes = require("./routes/chatRoutes");
const {
  router: websocketRoutes,
  setWebSocketServer,
} = require("./routes/websocketRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/filter", filterRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/websocket", websocketRoutes);

const port = process.env.PORT || 8080;
const server = http.createServer(app);

const clients = new Map();
const userRooms = new Map();
const conversationRooms = new Map();

const wss = new WebSocket.Server({
  server,
  path: "/ws",
  clientTracking: true,
  perMessageDeflate: false,
  maxPayload: 16 * 1024,
  verifyClient: () => true,
});

setWebSocketServer(wss);
global.wss = wss;

wss.on("connection", (ws) => {
  let userId = null;
  let userInfo = null;

  ws.isAlive = true;
  ws.userId = null;

  try {
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket connection established",
        timestamp: new Date().toISOString(),
      })
    );
  } catch {}

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "join":
          userId = data.userId;
          userInfo = data.userInfo;
          ws.userId = userId;

          if (clients.has(userId)) {
            const oldWs = clients.get(userId);
            if (oldWs !== ws && oldWs.readyState === WebSocket.OPEN) {
              oldWs.close(1000, "New connection established");
            }
          }

          clients.set(userId, ws);

          ws.send(
            JSON.stringify({
              type: "joined",
              userId: userId,
              message: "Successfully joined WebSocket",
              timestamp: new Date().toISOString(),
            })
          );

          broadcastToAll(
            {
              type: "user_online",
              userId: userId,
              userInfo: userInfo,
              timestamp: new Date().toISOString(),
            },
            userId
          );
          break;

        case "join_conversation":
          if (userId && data.conversationId) {
            if (!userRooms.has(userId)) userRooms.set(userId, new Set());
            userRooms.get(userId).add(data.conversationId);

            if (!conversationRooms.has(data.conversationId))
              conversationRooms.set(data.conversationId, new Set());
            conversationRooms.get(data.conversationId).add(userId);

            ws.send(
              JSON.stringify({
                type: "conversation_joined",
                conversationId: data.conversationId,
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "message":
        case "new_message":
          if (data.conversationId && userId) {
            const messageData = {
              type: "new_message",
              conversationId: data.conversationId,
              senderId: userId,
              receiverId: data.receiverId,
              content: data.content || data.text,
              messageId: data.messageId || `msg_${userId}_${Date.now()}`,
              timestamp: new Date().toISOString(),
              senderName: userInfo?.name || "Unknown User",
              senderAvatar: userInfo?.avatar || null,
            };
            broadcastToConversation(data.conversationId, messageData, userId);
          }
          break;

        case "typing_start":
        case "typing_stop":
          if (data.conversationId && userId) {
            broadcastToConversation(
              data.conversationId,
              {
                type: data.type,
                userId,
                conversationId: data.conversationId,
                ...(data.type === "typing_start" ? { userInfo } : {}),
                timestamp: new Date().toISOString(),
              },
              userId
            );
          }
          break;

        case "ping":
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "echo",
              originalMessage: data,
              timestamp: new Date().toISOString(),
            })
          );
      }
    } catch {
      try {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
            timestamp: new Date().toISOString(),
          })
        );
      } catch {}
    }
  });

  ws.on("close", () => {
    if (userId) {
      clients.delete(userId);

      if (userRooms.has(userId)) {
        for (const conversationId of userRooms.get(userId)) {
          if (conversationRooms.has(conversationId)) {
            conversationRooms.get(conversationId).delete(userId);
            if (conversationRooms.get(conversationId).size === 0) {
              conversationRooms.delete(conversationId);
            }
          }
        }
        userRooms.delete(userId);
      }

      broadcastToAll(
        {
          type: "user_offline",
          userId: userId,
          lastSeen: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        },
        userId
      );
    }
  });

  ws.on("error", () => {});

  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

function broadcastToAll(message, excludeUserId = null) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client, clientUserId) => {
    if (
      clientUserId !== excludeUserId &&
      client.readyState === WebSocket.OPEN
    ) {
      try {
        client.send(messageStr);
      } catch {
        clients.delete(clientUserId);
      }
    }
  });
}

function broadcastToConversation(
  conversationId,
  message,
  excludeUserId = null
) {
  if (!conversationRooms.has(conversationId)) return;

  const messageStr = JSON.stringify(message);
  const participantIds = conversationRooms.get(conversationId);

  participantIds.forEach((participantId) => {
    if (participantId !== excludeUserId && clients.has(participantId)) {
      const client = clients.get(participantId);
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch {
          clients.delete(participantId);
          participantIds.delete(participantId);
        }
      }
    }
  });
}

const healthCheckInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  });
}, 30000);

wss.on("close", () => {
  clearInterval(healthCheckInterval);
});

// server.listen(port);
server.listen(port, () => {
  console.log(`✅ Server is listening at http://localhost:${port}`);
  console.log(`🔌 WebSocket is listening at ws://localhost:${port}/ws`);
});

process.on("SIGTERM", () => {
  wss.clients.forEach((ws) => ws.close(1001, "Server shutting down"));
  clearInterval(healthCheckInterval);
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  wss.clients.forEach((ws) => ws.close(1001, "Server shutting down"));
  clearInterval(healthCheckInterval);
  server.close(() => process.exit(0));
});

module.exports = { app, server, wss };

