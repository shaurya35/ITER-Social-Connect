const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
const { isLoggedIn } = require("../middlewares/authMiddlewares");
const {
  getAllPosts,
  getUserPosts,
  getPost,
  createNewPost,
} = require("../controllers/feedControllerrs");

// Route to retrieve all posts for exploration or general browsing
router.get("/explore", getAllPosts);

// Route to retrieve all posts created by a specific user, based on their userId
router.get("/:userId/posts", isLoggedIn, getUserPosts);

// Route to retrieve the details of a single post by its postId
router.get("/posts/:postId", getPost);

// Route to create a new post, including image upload functionality, for a logged-in user
router.post("/posts", isLoggedIn, upload.single("image"), createNewPost);

module.exports = router;
