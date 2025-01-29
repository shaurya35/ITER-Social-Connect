// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const { getnotification } = require("../controllers/notificationControllers.js");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.get("/" , isLoggedIn , getnotification);

module.exports = router;