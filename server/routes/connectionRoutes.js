const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
} = require("../controllers/connectionControllers.js"); // Updated path for consistency
const { isLoggedIn } = require("../middlewares/authMiddlewares.js"); // Updated path and fixed typo

router.post("/send", isLoggedIn, sendConnectionRequest);

router.get("/requests", isLoggedIn, getConnectionRequests);

router.post("/respond", isLoggedIn, respondToConnectionRequest);

module.exports = router;
