const db = require("../firebase/firebaseConfig");
const { collection, getDocs } = require("firebase/firestore");

const search = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({ error: "Search query cannot be empty" });
    }

    // Normalize the search term for case-insensitivity
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const usersRef = collection(db, "users");
    const hashtagsRef = collection(db, "hashtags");
    const postsRef = collection(db, "posts");

    // Search for users whose `name` contains the query
    const usersSnapshot = await getDocs(usersRef);

    const matchingUsers = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        discordUrl: doc.data().discordUrl,
        about: doc.data().about,
      }))
      .filter((user) => user.name?.toLowerCase().includes(normalizedQuery));

    // Search for hashtags whose name matches the query
    const hashtagsSnapshot = await getDocs(hashtagsRef);
    const matchingHashtags = hashtagsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.id, // Document ID represents the hashtag name
        posts: doc.data().posts || [], // Posts field
      }))
      .filter((hashtag) =>
        hashtag.name.toLowerCase().includes(normalizedQuery)
      );

    // Collect related post IDs from the matching hashtags
    const relatedPostIds = matchingHashtags.flatMap((hashtag) =>
      hashtag.posts.map((post) => post.postId)
    );

    // Fetch posts from the posts collection based on the related post IDs
    let matchingPosts = [];
    if (relatedPostIds.length > 0) {
      const postsSnapshot = await getDocs(postsRef);
      matchingPosts = postsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((post) => relatedPostIds.includes(post.id))
        .map(({ id, content, userId, userName }) => ({
          id,
          content,
          userId,
          userName,
        })); // Remove likes and createdAt fields
    }

    const response = {
      message: "Search results retrieved successfully",
    };

    if (matchingUsers.length > 0) {
      response.users = matchingUsers;
    }

    if (matchingPosts.length > 0) {
      response.posts = matchingPosts;
    }

    if (matchingUsers.length === 0 && matchingPosts.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching users or posts found" });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
};

module.exports = {
  search,
};
