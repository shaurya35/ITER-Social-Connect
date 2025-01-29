// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const { getNotification } = require("../controllers/notificationControllers.js");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.get("/" , isLoggedIn , getNotification);

module.exports = router;