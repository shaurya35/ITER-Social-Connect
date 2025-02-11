// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();
const { authenticateUser } = require("../middlewares/authMiddlewares");


// --- Controller Functions ---
const { getAllPosts } = require("../controllers/feedControllers");

// Route to retrieve all posts
router.get("/",authenticateUser, getAllPosts);

// --- Export Router ---
module.exports = router;
