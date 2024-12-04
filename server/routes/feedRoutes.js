// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Cloudinary Configs ---
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// --- Controller Functions ---
const {
  getAllPosts,
  getUserPosts,
  getPost,
  createNewPost,
} = require("../controllers/feedControllerrs");

// --- Middleware Functions ---
const { isLoggedIn } = require("../middlewares/authMiddlewares");

// Route to retrieve all posts
router.get("/", getAllPosts);

// Route to retrieve all posts created by a specific user (Parameters: userId)
router.get("/:userId/posts", isLoggedIn, getUserPosts);

// Route to retrieve the details of a single post by its postId
router.get("/posts/:postId", getPost);

// Route to create a new post, including image upload functionality, for a logged-in user
router.post("/posts", isLoggedIn, upload.single("image"), createNewPost);

module.exports = router;
