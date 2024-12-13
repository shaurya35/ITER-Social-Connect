// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---

const {isLoggedIn} = require("../middlewares/authMiddlewares")
const { signup, signin, refreshAccessToken,verifyOtp, completeProfile } = require("../controllers/authControllers");

// --- Signup & Signin Routes ---
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-otp", verifyOtp);
// router.post("/complete-profile", isLoggedIn,completeProfile);  //logical issue
router.post("/refresh", refreshAccessToken)
router.post("/complete-profile", completeProfile)

// --- Export Router ---
module.exports = router;
