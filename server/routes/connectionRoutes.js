const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
  getAllConnections, // Add this new controller function
} = require("../controllers/connectionControllers.js"); // Updated path for consistency
const { isLoggedIn } = require("../middlewares/authMiddlewares.js"); // Updated path and fixed typo

router.post("/send", isLoggedIn, sendConnectionRequest);

router.get("/requests", isLoggedIn, getConnectionRequests);

router.post("/respond", isLoggedIn, respondToConnectionRequest);

router.get("/", isLoggedIn, getAllConnections); 
module.exports = router;