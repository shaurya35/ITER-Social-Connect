// connectionRoutes.js
const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
  getAllConnections,
  removeConnection,
  getConnectionStatus,
} = require("../controllers/connectionControllers");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.post("/send", isLoggedIn, sendConnectionRequest);
router.get("/requests", isLoggedIn, getConnectionRequests);
router.post("/respond", isLoggedIn, respondToConnectionRequest);
router.get("/", isLoggedIn, getAllConnections);
router.post("/remove", isLoggedIn, removeConnection);
router.get("/status/:targetUserId", isLoggedIn, getConnectionStatus);

module.exports = router;
