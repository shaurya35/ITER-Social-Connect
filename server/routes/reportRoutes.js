const express = require("express");
const { reportPost,reportUser } = require("../controllers/reportController");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/authMiddlewares");

router.post("/post", isLoggedIn, reportPost);
router.post("/user", isLoggedIn, reportUser);

module.exports = router;
