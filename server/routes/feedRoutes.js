// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const { getAllPosts } = require("../controllers/feedControllers");

// Route to retrieve all posts
router.get("/", getAllPosts);

// --- Export Router ---
module.exports = router;
