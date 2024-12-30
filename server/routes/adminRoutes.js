const express = require("express");
const {
  adminLogin,
  pendingRequest,
  handleRequest,
  deleteOtps,
  getReports,getPostReportDetails,getUserReportDetails
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


module.exports = router;
