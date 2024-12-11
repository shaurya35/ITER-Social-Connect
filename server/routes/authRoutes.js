// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const { signup, signin, refreshAccessToken, completeProfile } = require("../controllers/authControllers");

// --- Signup & Signin Routes ---
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/refresh", refreshAccessToken)
router.post("/complete", completeProfile)

// --- Export Router ---
module.exports = router;
