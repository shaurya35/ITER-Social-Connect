const express = require("express");
const router = express.Router();
const { postMessage, fetchMessages } = require("../controllers/chatController");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.post("/message", isLoggedIn, postMessage); 
router.get("/messages", isLoggedIn, fetchMessages); 

module.exports = router;
