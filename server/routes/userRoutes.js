// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Function ---
const {
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost,
} = require("../controllers/userControllers");

// --- Middleware Functions ---
const { isLoggedIn } = require("../middlewares/authMiddlewares");

// --- Post's Routes ---
router.get("/posts", isLoggedIn, getAllUserPosts); // Get all posts of a user
router.get("/post/:postId/", isLoggedIn, getUserPostById); // Get a post by id
router.post("/post", isLoggedIn, createUserPost); // Create a new post
router.put("/post/:postId/", isLoggedIn, updateUserPost); // Update a post
router.delete("/post/:postId/", isLoggedIn, deleteUserPost); // Delete a post

// --- Export Router ---
module.exports = router;
