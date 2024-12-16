// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const { getAllPosts, getPostById } = require("../controllers/feedControllers");

// Route to retrieve all posts
router.get("/", getAllPosts);
router.get("/:id", getPostById);

// --- Export Router ---
module.exports = router;
