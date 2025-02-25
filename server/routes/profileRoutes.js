const express = require("express");
const {
  getProfile,
  getUserProfile,
  getProfileData,
} = require("../controllers/profileControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/", isLoggedIn, getProfile);
router.get("/data", isLoggedIn, getProfileData);
router.get("/:userId", getUserProfile); // Someone else's profile

module.exports = router;
