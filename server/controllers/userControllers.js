const db = require("../firebase/firebaseConfig");
const {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} = require("firebase/firestore");

const getAllUserPosts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(200).json({ message: "User has no posts", posts: [] });
    }

    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ message: "Posts retrieved successfully", posts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

const createUserPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userName = userSnapshot.data().name;

    const postDoc = await addDoc(collection(db, "posts"), {
      userId,
      userName, // Include user's name
      content,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Post created successfully",
      postId: postDoc.id,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

const updateUserPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    if (postData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this post" });
    }

    await updateDoc(postRef, { content, updatedAt: new Date().toISOString() });

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

const deleteUserPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    if (postData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this post" });
    }

    await deleteDoc(postRef);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

const getUserPostById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    if (postData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to view this post" });
    }

    res.status(200).json({
      message: "Post retrieved successfully",
      post: {
        id: postSnapshot.id,
        ...postData,
      },
    });
  } catch (error) {
    console.error("Get Post by ID Error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

module.exports = {
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost,
};
