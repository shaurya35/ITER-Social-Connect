// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const {
  getNotifications,
  // sendFCMNotification,
  registerFCMToken,
} = require("../controllers/notificationControllers.js");

const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.get("/", isLoggedIn, getNotifications);
router.post("/register-token", isLoggedIn, registerFCMToken);
// router.post("/send-token", isLoggedIn, sendFCMNotification);

module.exports = router;
