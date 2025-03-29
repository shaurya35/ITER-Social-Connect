const express = require("express");
const router = express.Router();

const { search } = require("../controllers/searchController");
const { isLoggedIn } = require("../middlewares/authMiddlewares");


router.get("/",isLoggedIn, search);

module.exports = router;
