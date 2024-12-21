const express = require("express");
const {
  updateProfile,
} = require("../controllers/settingControllers");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.post("/updateProfile", isLoggedIn, updateProfile);

module.exports = router;
