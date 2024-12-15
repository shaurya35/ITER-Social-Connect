// routes/connectionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  sendConnectionRequest, 
  getConnectionRequests, 
  respondToConnectionRequest 
} = require('../controllers/connectionControllers');
const { protect } = require('../middleware/authMiddlewares'); // Auth middleware

router.post('/send', protect, sendConnectionRequest); // Send a connection request
router.get('/requests', protect, getConnectionRequests); // Get pending connection requests
router.post('/respond', protect, respondToConnectionRequest); // Accept or reject a request

module.exports = router;
