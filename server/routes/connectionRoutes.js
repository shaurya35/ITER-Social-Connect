const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
} = require("../controllers/connectionControllers");
const authenticateUser = require("../middlewares/authMiddlewares.js");

router.post("/send", authenticateUser, sendConnectionRequest); // Send a connection request

router.get("/requests", authenticateUser, getConnectionRequests); // Get pending connection requests

router.post("/respond", authenticateUser, respondToConnectionRequest); // Accept or reject a request

module.exports = router;