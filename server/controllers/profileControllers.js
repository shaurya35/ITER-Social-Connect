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

// --- Get User Profile ---
const getProfile = async (req, res) => {
  console.log("hello");
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    console.log("1", authHeader);
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
    console.log(decoded);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    //profile response
    const profileData = {
      name: userData.name,
      about: userData.about || "",
      profilePicture: userData.profilePicture || "",
      github: userData.github || "",
      linkedin: userData.linkedin || "",
      x: userData.x || "",
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
  getProfile,
};
