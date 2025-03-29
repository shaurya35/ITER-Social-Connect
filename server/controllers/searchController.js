const db = require("../firebase/firebaseConfig");
const {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAt,
  endAt,
} = require("firebase/firestore");

const search = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;
    const loggedInUserId = req.user?.userId;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search query cannot be empty" });
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();

    const usersRef = collection(db, "users");
    const hashtagsRef = collection(db, "hashtags");
    const postsRef = collection(db, "posts");

    const usersSnapshot = await getDocs(usersRef);

    const matchingUsers = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        profilePicture: doc.data().profilePicture,
        about: doc.data().about,
      }))
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(normalizedQuery) &&
          user.id !== loggedInUserId // Exclude logged-in user
      );

    const hashtagsSnapshot = await getDocs(hashtagsRef);

    const matchingHashtags = hashtagsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.id,
        posts: doc.data().posts || [],
      }))
      .filter((hashtag) =>
        hashtag.name.toLowerCase().includes(normalizedQuery)
      );

    const relatedPostIds = matchingHashtags.flatMap((hashtag) =>
      hashtag.posts.map((post) => post.postId)
    );

    let matchingPosts = [];
    if (relatedPostIds.length > 0) {
      const postsSnapshot = await getDocs(postsRef);

      matchingPosts = postsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((post) => relatedPostIds.includes(post.id))
        .map(({ id, content, userId }) => ({
          id,
          content,
          userId,
        }));
    }

    res.status(200).json({
      message: "Search results retrieved successfully",
      users: matchingUsers,
      posts: matchingPosts,
      hashtags: matchingHashtags.map((h) => h.name),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to perform search" });
  }
};



module.exports = {
  search,
};
