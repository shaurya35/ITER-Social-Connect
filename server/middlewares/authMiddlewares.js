// --- Required Imports ---
const jwt = require("jsonwebtoken");
require("dotenv").config();

// --- checks, extract, verify JWT tokens ---
const isLoggedIn = (req, res, next) => {
  const authHeader = req.headers.authorization; 
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token is missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      return res
        .status(401)
        .json({ error: "Invalid token: userId is missing" });
    }
    req.user = { userId: decoded.userId }; 
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// --- Export the function ---
module.exports = {
  isLoggedIn,
};
