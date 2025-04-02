const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
  getAllConnections,
  removeConnection, 
} = require("../controllers/connectionControllers.js");
const { isLoggedIn } = require("../middlewares/authMiddlewares.js");

router.post("/send", isLoggedIn, sendConnectionRequest);

router.get("/requests", isLoggedIn, getConnectionRequests);

router.post("/respond", isLoggedIn, respondToConnectionRequest);

router.get("/", isLoggedIn, getAllConnections);

router.post("/remove", isLoggedIn, removeConnection);

module.exports = router;