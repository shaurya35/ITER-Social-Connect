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
  updateProfilePhoto,
  updateBannerPhoto,
  getUserById,
} = require("../controllers/userControllers"); // Correct import

const { isLoggedIn } = require("../middlewares/authMiddlewares");

// Define Routes
router.get("/posts", isLoggedIn, getAllUserPosts); // GET all posts
router.get("/post/:postId", isLoggedIn, getUserPostById); // GET single post by ID
router.post("/post", isLoggedIn, createUserPost); // POST create new post
router.put("/post/:postId", isLoggedIn, updateUserPost); // PUT update post
router.delete("/post/:postId", isLoggedIn, deleteUserPost); // DELETE post
router.post("/posts/like", isLoggedIn, likePost);
router.get("/posts/bookmarks", isLoggedIn, getBookmarkedPosts);
router.post("/post/:postId/bookmark", isLoggedIn, bookmarkPost);
router.post("/post/share", sharePost);
router.post("/profile-photo", isLoggedIn, updateProfilePhoto);
router.post("/banner-photo", isLoggedIn, updateBannerPhoto);
router.get("/:id", getUserById);

module.exports = router;
