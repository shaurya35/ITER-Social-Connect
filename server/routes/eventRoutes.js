// --- Imports ---
const express = require("express");

// --- Router Configs ---
const router = express.Router();

const {
    createEvent,
    getEvent,
  } = require("../controllers/eventControllers.js"); // Updated path for consistency
  const { isLoggedIn } = require("../middlewares/authMiddlewares");
  
  router.post("/create",isLoggedIn, createEvent);
  
  router.get("/",getEvent);
  
  module.exports = router;