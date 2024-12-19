const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileControllers");
const { authenticateUser } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/:userId", authenticateUser, getProfile);

module.exports = router;
