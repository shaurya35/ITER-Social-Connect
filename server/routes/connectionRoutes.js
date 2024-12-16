// routes/connectionRoutes.js
const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
} = require("../controllers/connectionControllers");


router.post('/send', sendConnectionRequest); // Send a connection request
router.get('/requests', getConnectionRequests); // Get pending connection requests
router.post('/respond', respondToConnectionRequest); // Accept or reject a request

module.exports = router;