// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

// --- Controller Functions ---
const { signup, signin } = require("../controllers/authControllers");

// --- Signup & Signin Routes ---
router.post("/signup", signup);
router.post("/signin", signin);

// --- Export Router ---
module.exports = router;
