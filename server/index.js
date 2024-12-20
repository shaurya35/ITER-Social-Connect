// --- Express config ---
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// --- Express parse ---
const app = express();

// --- CORS config ---
const allowedOrigins = [
  "http://localhost:3000",
  "http://itersocialconnect.vercel.app",
  "https://itersocialconnect.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

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

// --- Use Routes ---
app.use("/api/auth", authRoutes); // Open auth routes
app.use("/api/feed", feedRoutes); // Open feed routes
app.use("/api/user", userRoutes); // Restricted user routes
app.use("/api/admin", adminRoutes); // Restricted admin routes
app.use("/api/connections", connectionRoutes); // Restricted connection routes
app.use("/api/comments", commentRoutes); // Restricted comment routes
app.use("/api/profile", profileRoutes); // Restricted profile routes

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
