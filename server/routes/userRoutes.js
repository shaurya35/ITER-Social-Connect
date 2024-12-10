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

// Import signup, signin, and completeProfile functions from authControllers
const {
  signup,
  signin,
  completeProfile,
} = require("../controllers/authControllers");

// --- Middleware Functions ---
const { isLoggedIn } = require("../middlewares/authMiddlewares");
// Import the file upload middleware
const fileUploadMiddleware = require("../middlewares/fileMiddlewares");

// --- Auth Routes ---
router.post("/signup", fileUploadMiddleware, signup); // Signup with ID card photo
router.post("/signin", signin); // Signin route
router.put(
  "/complete-profile",
  isLoggedIn,
  fileUploadMiddleware,
  completeProfile
); // Complete profile with optional photo

// --- Post's Routes ---
router.get("/posts", isLoggedIn, getAllUserPosts); // Get all posts of a user
router.get("/post/:postId", isLoggedIn, getUserPostById); // Get a post by id
router.post("/post", isLoggedIn, createUserPost); // Create a new post
router.put("/post/:postId", isLoggedIn, updateUserPost); // Update a post
router.delete("/post/:postId", isLoggedIn, deleteUserPost); // Delete a post

// --- Export Router ---
module.exports = router;
