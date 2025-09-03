// --- Required Imports ---
const jwt = require("jsonwebtoken");
require("dotenv").config();

// --- checks, extract, verify JWT tokens ---
const isLoggedIn = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  // const token = authHeader.split(" ")[1];
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    // console.log(authHeader)
  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[isLoggedIn] decoded token:", decoded);
    if (!decoded.userId) {
      return res
        .status(401)
        .json({ error: "Invalid token: userId is missing" });
    }
    // include email for fallback lookups
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const verifyToken = (req, res, next) => {
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded; // Attach user data if token is valid
      }
    });
  }

  next(); // Continue even if no token is present
};

// --- Export the function ---
module.exports = {
  isLoggedIn,
  authenticateAdmin,
  verifyAccessToken,
  verifyToken,
  authenticateUser,
};
