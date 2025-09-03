const {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;
    console.log('[getProfile] userId from req.user:', userId, 'email:', email);

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userDocRef = doc(db, "users", userId);
    let userDoc = await getDoc(userDocRef);
    if (!userDoc.exists() && email) {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', email));
      const snap = await getDocs(q);

      if (!snap.empty) {
        userDoc = snap.docs[0];
        console.log('[getProfile] found user doc by email, docId:', userDoc.id);
      }
    }

    if (!userDoc.exists()) {
      console.warn('[getProfile] still no user doc for id/email:', userId, email);
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    const postsQuery = query(collection(db, "posts"), where("userId", "==", (userDoc.id || userId)));
    const postsSnapshot = await getDocs(postsQuery);
    const posts = postsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const connectionsCount = userData.connectionsCount || 0;

    const profileData = {
      userId: userDoc.id,
      name: userData.name,
      email: userData.email,
      about: userData.about || "",
      profilePicture: userData.profilePicture || "",
      github: userData.github || "",
      linkedin: userData.linkedin || "",
      x: userData.x || "",
      connectionsCount,
      posts,
      regNo: userData.regNo,
      role: userData.role,
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("Get Profile With Posts Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getProfileData = async (req, res) => {
  try {
    // const authHeader = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return res
    //     .status(401)
    //     .json({ message: "Authorization header is missing or invalid" });
    // }

    // const token = authHeader.split(" ")[1];
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user profile data
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Fetch connection count
    // const connectionsCount = userData.connectionsCount || 0;

    // Combine profile and connections count data (without posts)
    const profileData = {
      userId: userId,
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

const getUserProfile = async (req, res) => {
  try {
    // Extract userId from query parameter
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user profile data
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Fetch user posts (optional, if public posts are allowed)
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", userId)
    );
    const postsSnapshot = await getDocs(postsQuery);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Build the profile response
    const profileData = {
      userId,
      name: userData.name,
      email: userData.email,
      about: userData.about || "",
      profilePicture: userData.profilePicture || "",
      github: userData.github || "",
      linkedin: userData.linkedin || "",
      x: userData.x || "",
      connectionsCount: userData.connectionsCount || 0,
      posts,
      regNo: userData.regNo,
      role: userData.role,
    };

    res.status(200).json(profileData);
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getProfile,
  getUserProfile,
  getProfileData,
};
