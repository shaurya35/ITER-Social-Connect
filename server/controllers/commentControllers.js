const db = require("../firebase/firebaseConfig.js");
const {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} = require("firebase/firestore");

const getAllComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const commentRef = collection(db, "posts", postId, "comments");
    const commentsSnapshot = await getDocs(commentRef);

    const comments = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Get All Comments Error:", error);
    res.status(500).json({
      error: "Failed to Fetch Comments!",
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Comment cannot be Empty!" });
    }

    const commentDoc = await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        userId,
        content,
        createdAt: new Date().toISOString(),
      }
    );

    res.status(200).json({
      message: "Comment Created Successfully!",
      commentId: commentDoc.id,
      user: {
        name: userData.name,
        profilePicture: userData.profilePicture,
      },
    });
  } catch (error) {
    console.error("Create Comment Error:", error);
    res.status(500).json({
      message: "Failed to create comment!",
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { commentId } = req.body;
    const userId = req.user.userId;

    if (!postId || !commentId) {
      return res
        .status(400)
        .json({ error: "Post ID and Comment ID are required" });
    }

    const commentRef = doc(db, "posts", postId, "comments", commentId);

    const commentSnapshot = await getDoc(commentRef);

    if (!commentSnapshot.exists()) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const commentData = commentSnapshot.data();

    if (commentData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this comment" });
    }

    await deleteDoc(commentRef);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

module.exports = {
  getAllComments,
  createComment,
  deleteComment,
};
