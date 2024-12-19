// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const { isLoggedIn } = require("../middlewares/authMiddlewares");
const {
  signup,
  signin,
  refreshAccessToken,
  verifyOtp,
  completeProfile,
  logout
} = require("../controllers/authControllers");

router.post("/signup",  signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", completeProfile);
router.post("/refresh", refreshAccessToken);

// --- Export Router ---
module.exports = router;
