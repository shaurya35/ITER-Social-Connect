// --- Express config ---
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// --- Express parse ---
const app = express();
app.use(express.json());

// --- CORS config ---
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

// --- Use Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
