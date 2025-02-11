const express = require("express");
const {
  adminLogin,
  pendingRequest,
  handleRequest,
  deleteOtps,
  getReports,
  getPostReportDetails,
  getUserReportDetails,
  updateUserBadges,
  deleteOldNotifications
} = require("../controllers/adminControllers");
const router = express.Router();
const { authenticateAdmin } = require("../middlewares/authMiddlewares");

router.post("/signin", adminLogin);
router.get("/pending-requests", authenticateAdmin, pendingRequest);
router.post("/handle-request", authenticateAdmin, handleRequest);
router.post("/delete-expired-otps", authenticateAdmin, deleteOtps);
router.get("/reports", authenticateAdmin, getReports);
router.get("/reports/post/:postId", authenticateAdmin, getPostReportDetails);
router.get("/reports/user/:userId", authenticateAdmin, getUserReportDetails);
router.post("/badges", authenticateAdmin, updateUserBadges);
router.delete("/delete-old-notifications", deleteOldNotifications);


module.exports = router;
