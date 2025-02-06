require("dotenv").config();
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
  arrayUnion,
  arrayRemove,
  writeBatch,
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
    const { content, profilePicture } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userName = userSnapshot.data().name;

    // Extract hashtags from content
    const hashtags =
      content.match(/#[a-zA-Z0-9_]+/g)?.map((tag) => tag.toLowerCase()) || [];

    // Save post to the `posts` collection
    const postDoc = await addDoc(collection(db, "posts"), {
      userId,
      userName,
      content,
      profilePicture,
      createdAt: new Date().toISOString(),
      likes: 0,
    });

    const postId = postDoc.id;

    // Update the `hashtags` collection
    const batch = writeBatch(db);
    const currentTime = new Date().toISOString();

    for (const tag of hashtags) {
      const hashtagRef = doc(db, "hashtags", tag);

      const hashtagSnapshot = await getDoc(hashtagRef);
      if (hashtagSnapshot.exists()) {
        // Hashtag exists: Update it
        batch.update(hashtagRef, {
          posts: arrayUnion({ postId, createdAt: currentTime }),
        });
      } else {
        // Hashtag does not exist: Create it
        batch.set(hashtagRef, {
          createdAt: currentTime,
          posts: [{ postId, createdAt: currentTime }],
        });
      }
    }

    // Commit the batch operation
    await batch.commit();

    res.status(201).json({
      message: "Post created successfully",
      postId,
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
    const userId = req.user.userId; // Authenticated user
    const { postId } = req.params;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    //If the user is not logged in (userId is undefined)
    if (!userId) {
      return res
        .status(403)
        .json({ error: "You need to log in to view this private post" });
    }

    // Successfully retrieve the post
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

const likePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();

    let likes = postData.likes || [];
    const userAlreadyLiked = likes.includes(userId);

    if (userAlreadyLiked) {
      // If user already liked, remove their ID (unlike functionality)
      likes = likes.filter((id) => id !== userId);
    } else {
      // Add user ID to the likes array
      likes.push(userId);
    }

    // Calculate the new like count
    const likeCount = likes.length;

    await updateDoc(postRef, { likes, likeCount });

    res.status(200).json({
      message: userAlreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      totalLikes: likeCount,
    });
  } catch (error) {
    console.error("Like Post Error:", error);
    res.status(500).json({ error: "Failed to like the post" });
  }
};

const bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const bookmarksCollectionRef = collection(userRef, "bookmarks");

    // Check if the post is already bookmarked
    const q = query(bookmarksCollectionRef, where("postId", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // If the bookmark exists, remove it
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(doc(bookmarksCollectionRef, docSnapshot.id));
      });
      return res.status(200).json({ message: "Post removed from bookmarks" });
    } else {
      // Add the bookmark as a new document
      await addDoc(bookmarksCollectionRef, { postId });
      return res.status(200).json({ message: "Post bookmarked successfully" });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({ error: "Error toggling bookmark" });
  }
};

const getBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userRef = doc(db, "users", userId); // Reference to the user's document
    const userDoc = await getDoc(userRef); // Fetch the user's document

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const bookmarksCollectionRef = collection(userRef, "bookmarks"); // Reference to the bookmarks subcollection
    const bookmarksSnapshot = await getDocs(bookmarksCollectionRef);

    if (bookmarksSnapshot.empty) {
      return res
        .status(200)
        .json({ message: "No bookmarks found", bookmarks: [] });
    }

    const postsRef = collection(db, "posts");
    const bookmarkedPosts = [];

    for (const bookmarkDoc of bookmarksSnapshot.docs) {
      const postId = bookmarkDoc.data().postId;
      const postDoc = await getDoc(doc(postsRef, postId));

      if (postDoc.exists()) {
        bookmarkedPosts.push({ id: postDoc.id, ...postDoc.data() });
      }
    }

    res.status(200).json({
      message: "Bookmarked posts fetched successfully",
      bookmarks: bookmarkedPosts,
    });
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    res.status(500).json({ error: "Error fetching bookmarked posts" });
  }
};

const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const baseUrl = process.env.BASE_URL; // Replace with your actual domain

    const directLink = `${baseUrl}/${postId}`;

    // Generate the WhatsApp sharable link
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(
      `Check out this post: ${directLink}`
    )}`;

    res.status(200).json({
      message: "Share links generated successfully",
      directLink,
      whatsappLink,
    });
  } catch (error) {
    console.error("Error generating share links:", error);
    res.status(500).json({ error: "Error generating share links" });
  }
};

module.exports = {
  likePost,
  getAllUserPosts,
  getUserPostById,
  createUserPost,
  updateUserPost,
  deleteUserPost,
  bookmarkPost,
  getBookmarkedPosts,
  sharePost,
};
