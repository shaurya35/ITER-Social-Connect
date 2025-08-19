const express = require("express")
const router = express.Router()

// Health check endpoint
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "ITER Social Connect Backend",
    websocket: "Available at ws://localhost:8080/ws",
  })
})

// WebSocket specific health check
router.get("/websocket", (req, res) => {
  // You can add WebSocket server status checks here
  res.json({
    status: "ok",
    websocket: {
      url: "ws://localhost:8080/ws",
      status: "running",
      timestamp: new Date().toISOString(),
    },
  })
})

module.exports = router
