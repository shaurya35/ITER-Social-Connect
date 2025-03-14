const db = require("../firebase/firebaseConfig");
const {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  doc,
  getDoc,
} = require("firebase/firestore");

// Get All Posts Route (Now Uses Middleware)
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit: limitParam = 10 } = req.query;
    const limitValue = parseInt(limitParam, 10);

    if (isNaN(page) || isNaN(limitValue) || page < 1 || limitValue < 1) {
      return res.status(400).json({ error: "Invalid page or limit parameter" });
    }

    const userId = req.user?.userId || null;

    const postsCollection = collection(db, "posts");
    let postsQuery = query(
      postsCollection,
      orderBy("createdAt", "desc"),
      limit(limitValue)
    );

    if (page > 1) {
      const allPostsSnapshot = await getDocs(
        query(postsCollection, orderBy("createdAt", "desc"))
      );
      const allPosts = allPostsSnapshot.docs;
      const startIndex = (page - 1) * limitValue;

      if (startIndex >= allPosts.length) {
        return res.status(200).json({ posts: [], hasMore: false });
      }

      const startDoc = allPosts[startIndex];
      postsQuery = query(
        postsCollection,
        orderBy("createdAt", "desc"),
        startAfter(startDoc),
        limit(limitValue)
      );
    }

    const postsSnapshot = await getDocs(postsQuery);
    let posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user details for each post
    const userPromises = posts.map(async (post) => {
      const userRef = doc(db, "users", post.userId);
      const userSnapshot = await getDoc(userRef);

      return {
        ...post,
        userName: userSnapshot.exists() ? userSnapshot.data().name : "Unknown",
        profilePicture: userSnapshot.exists()
          ? userSnapshot.data().profilePicture || ""
          : "",
        role: userSnapshot.exists()
          ? userSnapshot.data().role || "user"
          : "user",
      };
    });

    posts = await Promise.all(userPromises);

    let bookmarkedPosts = new Set();
    if (userId) {
      const bookmarksSnapshot = await getDocs(
        collection(db, `users/${userId}/bookmarks`)
      );

      bookmarksSnapshot.forEach((doc) => {
        bookmarkedPosts.add(doc.data().postId);
      });
    }

    posts = posts.map((post) => ({
      ...post,
      isBookmarked: bookmarkedPosts.has(post.id),
    }));

    const hasMore = posts.length === limitValue;

    res.status(200).json({
      posts,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch posts. Please try again later." });
  }
};

module.exports = { getAllPosts };
