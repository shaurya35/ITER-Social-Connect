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
  orderBy,
  limit,
  writeBatch,
} = require("firebase/firestore");

const getAllUserPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit: limitParam = 10 } = req.query;
    const limitValue = parseInt(limitParam, 10);

    if (isNaN(page) || isNaN(limitValue) || page < 1 || limitValue < 1) {
      return res.status(400).json({ error: "Invalid page or limit parameter" });
    }

    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnapshot.data();

    const postsCollection = collection(db, "posts");
    let postsQuery = query(
      postsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitValue)
    );

    if (page > 1) {
      const previousPostsSnapshot = await getDocs(
        query(
          postsCollection,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
      );
      const previousPosts = previousPostsSnapshot.docs;
      const startIndex = (page - 1) * limitValue;

      if (startIndex >= previousPosts.length) {
        return res.status(200).json({ posts: [], hasMore: false });
      }

      const startDoc = previousPosts[startIndex];
      postsQuery = query(
        postsCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(startDoc),
        limit(limitValue)
      );
    }

    const [postsSnapshot, bookmarksSnapshot] = await Promise.all([
      getDocs(postsQuery),
      getDocs(collection(db, `users/${userId}/bookmarks`)),
    ]);

    const bookmarkedPosts = new Set(
      bookmarksSnapshot.docs.map((doc) => doc.data().postId)
    );

    let posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      category: doc.data().category || "Uncategorized", // Ensure category is included
      userName: userData.name,
      profilePicture: userData.profilePicture || "",
      isBookmarked: bookmarkedPosts.has(doc.id),
    }));

    const hasMore = posts.length === limitValue;

    res.status(200).json({
      message: "Posts retrieved successfully",
      posts,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

const createUserPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, category } = req.body;

    const allowedCategories = [
      "aiml",
      "webdev",
      "mobile",
      "cloud",
      "cybersecurity",
      "datascience",
      "devops",
      "blockchain",
    ];

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    if (
      !category ||
      typeof category !== "string" ||
      !allowedCategories.includes(category.trim().toLowerCase())
    ) {
      return res.status(400).json({
        error:
          "Invalid category. Allowed categories: " +
          allowedCategories.join(", "),
      });
    }

    // Store userId and category in posts collection
    const postRef = await addDoc(collection(db, "posts"), {
      userId,
      content,
      category: category.trim().toLowerCase(), // Store category in lowercase
      createdAt: new Date().toISOString(),
      likes: [],
    });

    const postId = postRef.id;

    // Extract hashtags from post content
    const batch = writeBatch(db);
    const hashtags =
      content.match(/#[a-zA-Z0-9_]+/g)?.map((tag) => tag.toLowerCase()) || [];
    const currentTime = new Date().toISOString();

    for (const tag of hashtags) {
      const hashtagRef = doc(db, "hashtags", tag);
      const hashtagSnapshot = await getDoc(hashtagRef);

      if (hashtagSnapshot.exists()) {
        batch.update(hashtagRef, {
          posts: arrayUnion({ postId, createdAt: currentTime }),
        });
      } else {
        batch.set(hashtagRef, {
          createdAt: currentTime,
          posts: [{ postId, createdAt: currentTime }],
        });
      }
    }

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
    const { postId } = req.params;

    // Fetch post details first
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    const postOwnerId = postData.userId; // Fetch userId from post data

    // Fetch post owner's details
    const userRef = doc(db, "users", postOwnerId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "Post owner not found" });
    }

    // Fetch bookmark status for the logged-in user
    const loggedInUserId = req.user?.userId;
    let isBookmarked = false;

    if (loggedInUserId) {
      const bookmarkRef = doc(db, `users/${loggedInUserId}/bookmarks`, postId);
      const bookmarkSnapshot = await getDoc(bookmarkRef);
      isBookmarked = bookmarkSnapshot.exists();
    }

    const userData = userSnapshot.data();

    res.status(200).json({
      message: "Post retrieved successfully",
      post: {
        id: postSnapshot.id,
        ...postData,
        category: postData.category, // Include category in the response
        isBookmarked,
        userName: userData.name,
        profilePicture: userData.profilePicture || "",
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
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      return res.status(404).json({ error: "Post not found" });
    }

    const postData = postSnapshot.data();
    let likes = postData.likes || [];

    const userIndex = likes.indexOf(userId);
    const userAlreadyLiked = userIndex !== -1;

    if (userAlreadyLiked) {
      // Remove user ID from likes array (unlike)
      likes.splice(userIndex, 1);
    } else {
      // Add user ID to likes array (like)
      likes.push(userId);
    }

    // Update the post with the new likes array and like count
    await updateDoc(postRef, {
      likes,
      likeCount: likes.length,
    });

    res.status(200).json({
      message: userAlreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      totalLikes: likes.length,
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
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const baseUrl =
      process.env.BASE_URL || "https://itersocialconnect.vercel.app";
    const directLink = `${baseUrl}/post/${postId}`;
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
