const express = require("express");
const router = express.Router();
const {
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost,
  likePost,
  bookmarkPost,
  getBookmarkedPosts,
  sharePost,
  search,
} = require("../controllers/userControllers"); // Correct import

const { isLoggedIn } = require("../middlewares/authMiddlewares");

// Define Routes
router.get("/posts", isLoggedIn, getAllUserPosts); // GET all posts
router.get("/post/:postId", isLoggedIn, getUserPostById); // GET single post by ID
router.post("/post", isLoggedIn, createUserPost); // POST create new post
router.put("/post/:postId", isLoggedIn, updateUserPost); // PUT update post
router.delete("/post/:postId", isLoggedIn, deleteUserPost); // DELETE post
router.post("/posts/:postId/like", likePost); // Like or unlike a post
router.get("/posts/bookmarks", isLoggedIn, getBookmarkedPosts);
router.post("/post/:postId/bookmark", isLoggedIn, bookmarkPost);
router.get("/post/:postId/share", sharePost);

module.exports = router;
