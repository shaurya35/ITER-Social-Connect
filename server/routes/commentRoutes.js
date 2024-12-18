// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const {
  getAllComments,
  createComment,
  deleteComment,
} = require("../controllers/commentControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

// Route to retrieve all posts
router.get("/:postId/", isLoggedIn, getAllComments);
router.post("/:postId/", isLoggedIn, createComment);
router.delete("/:postId/", isLoggedIn, deleteComment);

// --- Export Router ---
module.exports = router;
