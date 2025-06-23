const express = require("express");
const router = express.Router();
const { postMessage, fetchMessages,fetchUserConversations,searchUsers } = require("../controllers/chatController");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.post("/message", isLoggedIn, postMessage); 
router.get("/messages", isLoggedIn, fetchMessages); 
router.get("/conversations", isLoggedIn, fetchUserConversations); 
router.get("/search", isLoggedIn, searchUsers); 

module.exports = router;
