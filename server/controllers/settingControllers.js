const {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");
const { updateDoc } = require("firebase/firestore");

const isValidUrl = (url, platform) => {
  const regexes = {
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
    github: /^https?:\/\/(www\.)?github\.com\/.*$/i,
    x: /^https?:\/\/(www\.)?x\.com\/.*$/i,
  };
  return regexes[platform]?.test(url);
};

const updateProfile = async (req, res) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing or invalid" });
    }

    const token = authHeader.split(" ")[1]; // Extract the token after "Bearer "
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Retrieve updated profile details from the request body
    const { name, about, github, linkedin, x } = req.body;

    // Check if any fields are provided for the update
    if (!name && !about && !github && !linkedin && !x) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided to update" });
    }

    // Query Firestore to check if the user exists
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Validate social media links (if provided)
    if (linkedin && !isValidUrl(linkedin, "linkedin")) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }
    if (github && !isValidUrl(github, "github")) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }
    if (x && !isValidUrl(x, "x")) {
      return res.status(400).json({ message: "Invalid X URL" });
    }

    // Update user profile in Firestore
    const updateData = {
      ...(name && { name }),
      ...(about && { about }),
      ...(github && { github }),
      ...(linkedin && { linkedin }),
      ...(x && { x }),
    };

    await updateDoc(userRef, updateData);

    // Fetch updated user data
    const updatedUserDoc = await getDoc(userRef);
    const updatedUserData = updatedUserDoc.data();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUserData,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = {
  updateProfile,
};
