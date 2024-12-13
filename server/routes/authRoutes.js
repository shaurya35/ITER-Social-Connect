// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const { signup, signin, verifyOtp,completeProfile } = require("../controllers/authControllers");

const {isLoggedIn} = require("../middlewares/authMiddlewares")

// --- Signup & Signin Routes ---
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", isLoggedIn,completeProfile);

// --- Export Router ---
module.exports = router;
