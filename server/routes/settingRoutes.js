const express = require("express");
const {
  updateProfile,
  changePassword,
} = require("../controllers/settingControllers");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Route to fetch user profile
router.post("/updateProfile", isLoggedIn, updateProfile);
router.post("/change-password", isLoggedIn, changePassword);

module.exports = router;
