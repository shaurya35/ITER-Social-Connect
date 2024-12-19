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
  
  // --- Update User Profile ---
  const updateProfile = async (req, res) => {
    try {
      const { userId } = req.params;
      const { name, about, github, linkedin, twitter } = req.body;
  
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Validate social media links (if provided)
      if (linkedin && !isValidUrl(linkedin, "linkedin")) {
        return res.status(400).json({ message: "Invalid LinkedIn URL" });
      }
      if (github && !isValidUrl(github, "github")) {
        return res.status(400).json({ message: "Invalid GitHub URL" });
      }
      if (twitter && !isValidUrl(twitter, "twitter")) {
        return res.status(400).json({ message: "Invalid Twitter URL" });
      }
  
      // Update user profile in Firestore
      await updateDoc(doc(db, "users", userId), {
        name: name || userDoc.data().name,
        about: about || userDoc.data().about,
        github: github || userDoc.data().github,
        linkedin: linkedin || userDoc.data().linkedin,
        twitter: twitter || userDoc.data().twitter,
      });
  
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  };
  
  module.exports = {
    getProfile,
    updateProfile,
  };
  