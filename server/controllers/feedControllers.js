const db = require("../firebase/firebaseConfig");
const { collection, getDocs, query, orderBy } = require("firebase/firestore");

const getAllPosts = async (req, res) => {
  try {
    const postsCollection = collection(db, "posts");

    // Query to order posts by 'createdAt' field in descending order
    const postsQuery = query(postsCollection, orderBy("createdAt", "desc"));

    const postsSnapshot = await getDocs(postsQuery);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(400).json({
      error: "Failed to fetch posts. Please try again later.",
    });
  }
};

module.exports = { getAllPosts };
