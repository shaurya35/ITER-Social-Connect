const express = require("express")
const router = express.Router()
const chatController = require("../controllers/chatController")

const { isLoggedIn } = require("../middlewares/authMiddlewares") 
router.use(isLoggedIn)

router.get("/conversations", chatController.getConversations)
router.get("/messages", chatController.getMessages)
router.post("/message", chatController.sendMessage) 
router.post("/conversations", chatController.createConversation)
router.get("/search", chatController.searchUsers)

module.exports = router
