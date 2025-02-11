// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const { getNotifications} = require("../controllers/notificationControllers.js");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.get("/" , isLoggedIn , getNotifications);

module.exports = router;