const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/:userId", isLoggedIn, getProfile);

module.exports = router;
