const express = require("express");
const router = express.Router();
const {
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost
} = require("../controllers/userControllers");  // Correct import

const { isLoggedIn } = require("../middlewares/authMiddlewares");

// Define Routes
router.get("/posts", isLoggedIn, getAllUserPosts);  // GET all posts
router.get("/post/:postId", isLoggedIn, getUserPostById);  // GET single post by ID
router.post("/post", isLoggedIn, createUserPost);  // POST create new post
router.put("/post/:postId", isLoggedIn, updateUserPost);  // PUT update post
router.delete("/post/:postId", isLoggedIn, deleteUserPost);  // DELETE post

module.exports = router;