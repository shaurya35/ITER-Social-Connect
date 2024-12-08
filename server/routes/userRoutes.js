// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const {
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost,
} = require("../controllers/userControllers");

// Import updateProfile function from authControllers
const { updateProfile } = require("../controllers/authControllers");

// --- Middleware Functions ---
const { isLoggedIn } = require("../middlewares/authMiddlewares");
// Import the file upload middleware
const fileUploadMiddleware = require("../middlewares/fileMiddleware");

// --- Post's Routes ---
router.get("/posts", isLoggedIn, getAllUserPosts); // Get all posts of a user
router.get("/post/:postId/", isLoggedIn, getUserPostById); // Get a post by id
router.post("/post", isLoggedIn, createUserPost); // Create a new post
router.put("/post/:postId/", isLoggedIn, updateUserPost); // Update a post
router.delete("/post/:postId/", isLoggedIn, deleteUserPost); // Delete a post

// --- Profile Routes ---
// Adding profile update route with file upload middleware
router.put("/profile", isLoggedIn, fileUploadMiddleware, updateProfile); // Update user profile with optional photo

// --- Export Router ---
module.exports = router;
