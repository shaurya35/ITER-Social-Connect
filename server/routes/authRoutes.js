// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const {
  signup,
  signin,
  refreshAccessToken,
  verifyOtp,
  completeProfile,
  logout,
  forgetPassword,
  verifyOtpForForgetPassword,resetPassword,teacherSignup
} = require("../controllers/authControllers");

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", completeProfile);
router.post("/refresh", refreshAccessToken);
router.post("/forget-password", forgetPassword);
router.post("/verify-forget-password-otp", verifyOtpForForgetPassword);
router.post("/reset-password", resetPassword);
router.post("/teacher-signup", teacherSignup);

// --- Export Router ---
module.exports = router;
