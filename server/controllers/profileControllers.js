const {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
  } = require("firebase/firestore");
  const db = require("../firebase/firebaseConfig");
  // --- Get User Profile ---
  const getProfile = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const userData = userDoc.data();
  
      // Fetch user posts
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      //profile response
      const profileData = {
        name: userData.name,
        bio: userData.about || "",
        profilePicture: userData.profilePicture || "",
        github: userData.github || "",
        linkedin: userData.linkedin || "",
        twitter: userData.twitter || "",
        posts,
        likedPosts,
        comments,
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
  