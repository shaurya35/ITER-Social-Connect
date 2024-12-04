// --- Express config ---
const express = require("express");
const cors = require('cors');
require('dotenv').config();

// --- Express parse --- 
const app = express();
app.use(express.json()); 

// --- CORS config ---
app.use(cors({
  origin: 'https://localhost:3000/', 
  methods: 'GET,POST,PUT,DELETE', 
  allowedHeaders: 'Content-Type, Authorization', 
}));

// --- .env Port ---
const port = 3000 || process.env.PORT;

// --- Base Route ---
app.get("/", isLoggedIn, (req, res) => {
  res.json("Test Api!!");
});

// --- Route Imports ---
const { isLoggedIn } = require("./middlewares/authMiddlewares");
const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");

// --- Use Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
