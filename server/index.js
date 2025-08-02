const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const admin = require('firebase-admin'); 
const NotificationCronService = require('./services/NotificationCronService'); 
require("dotenv").config();

// Firebase Admin initialization (your existing code)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.projectId, 
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID, 
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL, 
        client_id: process.env.FIREBASE_CLIENT_ID, 
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
    
    // Start notification cron jobs AFTER Firebase Admin is initialized
    NotificationCronService.startCronJobs();
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

const rateLimiter = require("./middlewares/rateLimiter")

// --- Express parse ---
const app = express();

// --- Logger Middleware (Logs all incoming requests) ---
app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res), // HTTP Method
      tokens.url(req, res),    // Route
      tokens.status(req, res), // Status Code
      "in",
      tokens["response-time"](req, res) + "ms", // Response Time
    ].join(" ");
  })
);

// --- CORS config ---
// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://itersocialconnect.vercel.app",
//   "https://itersocialconnect.vercel.app",
// ];

const allowedOrigins = [
  "http://localhost:3000",
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
  "https://www.iterconnect.live" 

];


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
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

// Additional security headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Set-Cookie");
  next();
});

// --- Body parser config ---
app.use(express.json());

// --- Cookie parse ---
app.use(cookieParser());

// --- Global error handler ---
app.use((err, req, res, next) => {
  if (err instanceof Error && err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "CORS not allowed for this origin" });
  } else if (err instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid JSON payload" });
  } else {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- .env Port ---
const port = process.env.PORT || 8080;

// --- Base Route ---
app.get("/", (req, res) => {
  res.json("Test Api!!");
});

// --- Route Imports ---
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
const fcmRoutes = require('./routes/fcm');

// --- Use Routes ---
app.use("/api/auth",authRoutes);
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
app.use("/api/fcm", fcmRoutes);


app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain, 
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
  });
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
