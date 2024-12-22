const { collection, query, where, getDocs, doc, getDoc } = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");

// Get User Profile with Posts
const getProfile = async (req, res) => {
  try {
    // Extract and verify the token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header is missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user profile data
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Fetch user posts
    const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
    const postsSnapshot = await getDocs(postsQuery);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Combine profile and posts data
    const profileData = {
      name: userData.name,
      about: userData.about || "",
      profilePicture: userData.profilePicture || "",
      github: userData.github || "",
      linkedin: userData.linkedin || "",
      x: userData.x || "",
      posts,
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("Get Profile With Posts Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getProfile,
};