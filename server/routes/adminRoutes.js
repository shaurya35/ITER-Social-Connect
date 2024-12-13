const express = require("express");
const {
  adminLogin,
  pendingRequest,
  handleRequest,
} = require("../controllers/adminControllers");
const router = express.Router();
const { authenticateAdmin } = require("../middlewares/authMiddlewares");

router.post("/login", adminLogin);
router.get("/pending-requests", authenticateAdmin, pendingRequest);
router.get("/handle-request", authenticateAdmin, handleRequest);

module.exports = router;
