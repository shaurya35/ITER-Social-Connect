const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");  // Import morgan
require("dotenv").config();
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

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
