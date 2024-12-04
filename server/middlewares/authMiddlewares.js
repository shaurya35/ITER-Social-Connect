// --- Required Imports --- 
const jwt = require("jsonwebtoken");
require("dotenv").config();

// --- fill the purpose of this function ---
const isLoggedIn = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send("Invalid or expired token");
  }
};

// --- Export the function ---
module.exports = {
  isLoggedIn,
};
