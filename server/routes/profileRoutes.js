const express = require("express");
const {
  getProfile, getUserProfile
} = require("../controllers/profileControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/profile", isLoggedIn, getProfile);
router.get('/profile/:userId', getUserProfile); // Someone else's profile

module.exports = router;
