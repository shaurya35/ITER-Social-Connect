const express = require("express");
const router = express.Router();

const { filterByInterest } = require("../controllers/filterControllers");

router.get("/", filterByInterest);

module.exports = router;
