const db = require("../firebase/firebaseConfig");
const {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} = require("firebase/firestore");

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

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.size == 0) {
      return res.status(200).json({
        message: "User have no posts",
        posts: [],
      });
    }
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      message: "Posts retrieved successfully",
      posts,
    });
  } catch (error) {
    res.status(400).json({ error: "failed to fetch user posts" });
  }
};

const getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const docRef = doc(db, "posts", postId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return res.status(404).json({
        message: "Post not found",
        post: null,
      });
    }

    const post = { id: docSnapshot.id, ...docSnapshot.data() };

    return res.status(200).json({
      message: "Post retrieved successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error retrieving post",
    });
  }
};

const createNewPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { path, filename } = req.file;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const { email } = req.user;
    if (!email) {
      return res
        .status(401)
        .json({ error: "Unauthorized access. Email is missing." });
    }

    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const docRef = await addDoc(collection(db, "posts"), {
      content,
      image: {
        path,
        filename,
      },
      userId,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
    });

    res.status(201).json({
      id: docRef.id,
      message: "Post created successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create post. Please try again later." });
  }
};

module.exports = { getAllPosts, getUserPosts, getPost, createNewPost };
