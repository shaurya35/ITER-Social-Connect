const express = require("express");
const {
  adminLogin,
  pendingRequest,
  handleRequest,
  deleteOtps,
} = require("../controllers/adminControllers");
const router = express.Router();
const { authenticateAdmin } = require("../middlewares/authMiddlewares");

router.post("/signin", adminLogin);
router.get("/pending-requests", authenticateAdmin, pendingRequest);
router.post("/handle-request", authenticateAdmin, handleRequest);
router.post("/delete-expired-otps", authenticateAdmin, deleteOtps);

module.exports = router;
