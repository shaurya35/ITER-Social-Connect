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

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required." });
    }

    // Reference to the "comments" subcollection inside "posts"
    const commentRef = collection(db, "posts", postId, "comments");
    const commentsSnapshot = await getDocs(commentRef);

    const comments = await Promise.all(
      commentsSnapshot.docs.map(async (commentDoc) => {
        const commentData = commentDoc.data();
        console.log(commentData);

        // Check if `userId` exists in the comment data
        let user = { name: "Unknown User", profilePicture: null };
        if (commentData.userId) {
          const userRef = doc(db, "users", commentData.userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            user = {
              name: userSnap.data().name || "Unknown User",
              profilePicture: userSnap.data().profilePicture || null,
            };
          }
        }

        return {
          id: commentDoc.id,
          ...commentData,
          user, // Include user details
        };
      })
    );

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Get All Comments Error:", error);
    res.status(500).json({ error: "Failed to Fetch Comments!" });
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

    // Fetch post details
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnap.data();
    const postOwnerId = postData.userId;

    // Create the comment
    const commentDoc = await addDoc(
      collection(db, "posts", postId, "comments"),
      {
        userId,
        content,
        createdAt: new Date().toISOString(),
      }
    );

    // Fetch user details
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnapshot.data();

    // Limit comment preview to 50 characters
    const previewContent =
      content.length > 50 ? content.substring(0, 47) + "..." : content;

    // Send notification to post owner
    if (postOwnerId !== userId) {
      // Prevent self-notification
      const notificationRef = doc(collection(db, "notifications"));

      await setDoc(notificationRef, {
        userId: postOwnerId,
        senderId: userId,
        senderName: userData.name || "Unknown",
        senderProfilePicture: userData.profilePicture || "",
        message: `${userData.name} commented: "${previewContent}" — View Post`,
        postId: postId,
        timestamp: Date.now(),
        isRead: false,
        type: "comment",
        postId: postId,
      });
    }

    // Respond with comment ID and user details
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
