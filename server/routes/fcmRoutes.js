const express = require("express");
const { saveFCMToken } = require("../controllers/fcmControllers");
// Comment out auth middleware for now to test FCM
// const authenticateToken = require("../middlewares/authMiddleware");

const router = express.Router();

// Remove auth middleware temporarily for testing
router.post("/save-fcm-token", saveFCMToken);

module.exports = router;
