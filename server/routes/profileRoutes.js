const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileControllers");
const { authenticateUser } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/:userId", authenticateUser, getProfile);

// Route to update user profile
router.put("/:userId", authenticateUser, updateProfile);

module.exports = router;
