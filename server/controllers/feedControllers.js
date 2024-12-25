const db = require("../firebase/firebaseConfig");
const { collection, getDocs, doc, getDoc } = require("firebase/firestore");

const getAllPosts = async (req, res) => {
  try {
    const postsCollection = collection(db, "posts");
    const postsSnapshot = await getDocs(postsCollection);

    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      posts,
    });
  } catch (error) {
    res.status(400).json({
      error: "Failed to fetch posts. Please try again later.",
    });
  }
};

module.exports = { getAllPosts };
