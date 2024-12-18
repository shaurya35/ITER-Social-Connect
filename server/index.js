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
    allowedHeaders: ["Content-Type", "Authorization"],
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
  } else {
    next(err);
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
const commentRoutes = require("./routes/commentRoutes")

// --- Use Routes ---
app.use("/api/auth", authRoutes);
// open feed routes
app.use("/api/feed", feedRoutes);
// restriced user routes
app.use("/api/user", userRoutes);
// restricted admin routes
app.use("/api/admin", adminRoutes);
// restricted connection routes
app.use("/api/connections", connectionRoutes);
// restricted comment routes
app.use("/api/comments", commentRoutes);


// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
