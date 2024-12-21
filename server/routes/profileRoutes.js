const express = require("express");
const {
  getProfile,
} = require("../controllers/profileControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.get("/getProfile", isLoggedIn, getProfile);

module.exports = router;
