// --- Express config ---
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// --- Express parse ---
const app = express();
app.use(express.json());

// --- Cookie parse ---  
app.use(cookieParser());

// --- CORS config ---

const allowedOrigins = ["http://localhost:3000","http://itersocialconnect.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(cors());

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

// --- Use Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/user", userRoutes);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
