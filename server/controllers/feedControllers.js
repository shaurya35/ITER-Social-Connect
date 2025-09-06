// const db = require("../firebase/firebaseConfig");
// const {
//   collection,
//   getDocs,
//   query,
//   orderBy,
//   limit,
//   startAfter,
//   where,
//   doc,
//   getDoc,
// } = require("firebase/firestore");

// // Get All Posts Route (Now Uses Middleware)
// const getAllPosts = async (req, res) => {
//   try {
//     const { page = 1, limit: limitParam = 10 } = req.query;
//     const limitValue = parseInt(limitParam, 10);

//     if (isNaN(page) || isNaN(limitValue) || page < 1 || limitValue < 1) {
//       return res.status(400).json({ error: "Invalid page or limit parameter" });
//     }

//     const userId = req.user?.userId || null;
//     const postsCollection = collection(db, "posts");

//     let postsQuery = query(
//       postsCollection,
//       orderBy("createdAt", "desc"),
//       limit(limitValue)
//     );

//     if (page > 1) {
//       const allPostsSnapshot = await getDocs(
//         query(postsCollection, orderBy("createdAt", "desc"))
//       );
//       const allPosts = allPostsSnapshot.docs;

//       const startIndex = (page - 1) * limitValue;
//       if (startIndex >= allPosts.length) {
//         return res.status(200).json({ posts: [], hasMore: false });
//       }

//       const startDoc = allPosts[startIndex];

//       if (startDoc) {
//         postsQuery = query(
//           postsCollection,
//           orderBy("createdAt", "desc"),
//           startAfter(startDoc), // Ensure `startDoc` is valid
//           limit(limitValue)
//         );
//       }
//     }

//     const postsSnapshot = await getDocs(postsQuery);
//     let posts = postsSnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//       category: doc.data().category || "Uncategorized", // Default category
//     }));

//     // Fetch user details for each post (Ensure userId exists)
//     const userPromises = posts.map(async (post) => {
//       if (!post.userId)
//         return {
//           ...post,
//           userName: "Unknown",
//           profilePicture: "",
//           role: "user",
//         };

//       const userRef = doc(db, "users", post.userId);
//       const userSnapshot = await getDoc(userRef);

//       return {
//         ...post,
//         userName: userSnapshot.exists() ? userSnapshot.data().name : "Unknown",
//         profilePicture: userSnapshot.exists()
//           ? userSnapshot.data().profilePicture || ""
//           : "",
//         role: userSnapshot.exists()
//           ? userSnapshot.data().role || "user"
//           : "user",
//       };
//     });

//     posts = await Promise.all(userPromises);

//     let bookmarkedPosts = new Set();
//     if (userId) {
//       const bookmarksSnapshot = await getDocs(
//         collection(db, `users/${userId}/bookmarks`)
//       );

//       bookmarksSnapshot.forEach((doc) => {
//         bookmarkedPosts.add(doc.data().postId);
//       });
//     }

//     posts = posts.map((post) => ({
//       ...post,
//       isBookmarked: bookmarkedPosts.has(post.id),
//     }));

//     const hasMore = posts.length === limitValue;

//     res.status(200).json({
//       posts,
//       hasMore,
//     });
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     res
//       .status(500)
//       .json({ error: "Failed to fetch posts. Please try again later." });
//   }
// };

// module.exports = { getAllPosts };



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
  getCountFromServer,
} = require("firebase/firestore");

const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit: limitParam = 10, role } = req.query;
    const limitValue = parseInt(limitParam, 10);
    const currentUserId = req.user?.userId; 

    if (isNaN(page) || isNaN(limitValue) || page < 1 || limitValue < 1) {
      return res.status(400).json({ error: "Invalid page or limit parameter" });
    }

    const postsCollection = collection(db, "posts");
    
    // If role filtering is requested, we need a different approach
    if (role && (role === 'teacher' || role === 'alumni')) {
      // For role filtering, we need to fetch all posts and filter by user role
      // This is less efficient but necessary since posts don't contain role info
      const allPostsSnapshot = await getDocs(
        query(postsCollection, orderBy("createdAt", "desc"))
      );
      
      let allPosts = allPostsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user details for all posts to filter by role
      const postsWithUserData = await Promise.all(
        allPosts.map(async (post) => {
          if (!post.userId) return { ...post, role: 'user' };

          const userRef = doc(db, "users", post.userId);
          const userSnapshot = await getDoc(userRef);

          if (!userSnapshot.exists()) return { ...post, role: 'user' };

          const userData = userSnapshot.data();
          return {
            ...post,
            userName: userData.name || "Unknown",
            profilePicture: userData.profilePicture || "",
            role: userData.role || "user",
          };
        })
      );

      // Filter by role
      const filteredPosts = postsWithUserData.filter(post => post.role === role);
      
      // Apply pagination to filtered results
      const startIndex = (page - 1) * limitValue;
      const endIndex = startIndex + limitValue;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
      
      // Process the paginated posts
      let posts = paginatedPosts.map((post) => {
        const likesArray = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = currentUserId ? likesArray.includes(currentUserId) : false;
        
        return {
          ...post,
          isLiked,
          likeCount: likesArray.length,
          category: post.category || "Uncategorized",
        };
      });

      // Fetch comment counts for filtered posts
      const postsWithCommentCount = await Promise.all(
        posts.map(async (post) => {
          try {
            const commentsRef = collection(db, "posts", post.id, "comments");
            const countQuery = query(commentsRef);
            const countSnapshot = await getCountFromServer(countQuery);
            const commentCount = countSnapshot.data().count;
            
            return {
              ...post,
              commentCount,
            };
          } catch (error) {
            console.error(`Error fetching comment count for post ${post.id}:`, error);
            return {
              ...post,
              commentCount: 0,
            };
          }
        })
      );

      posts = postsWithCommentCount;

      // Fetch bookmarks
      let bookmarkedPosts = new Set();
      if (currentUserId) {
        const bookmarksSnapshot = await getDocs(
          collection(db, `users/${currentUserId}/bookmarks`)
        );
        bookmarksSnapshot.forEach((doc) => {
          bookmarkedPosts.add(doc.data().postId);
        });
      }

      // Add isBookmarked
      posts = posts.map((post) => ({
        ...post,
        isBookmarked: bookmarkedPosts.has(post.id),
      }));

      const hasMore = endIndex < filteredPosts.length;

      return res.status(200).json({
        posts,
        hasMore,
      });
    }

    // Original logic for non-role filtering
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
      
      if (startDoc) {
        postsQuery = query(
          postsCollection,
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(limitValue)
        );
      }
    }

    const postsSnapshot = await getDocs(postsQuery);
    let posts = postsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const likesArray = Array.isArray(data.likes) ? data.likes : [];
      const isLiked = currentUserId ? likesArray.includes(currentUserId) : false;
      
      return {
        id: doc.id,
        ...data,
        isLiked, // Add isLiked field
        likeCount: likesArray.length, // Always use array length
        category: data.category || "Uncategorized",
      };
    });

    // Fetch comment count for each post using count aggregation (more efficient)
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        try {
          const commentsRef = collection(db, "posts", post.id, "comments");
          const countQuery = query(commentsRef);
          const countSnapshot = await getCountFromServer(countQuery);
          const commentCount = countSnapshot.data().count;
          
          return {
            ...post,
            commentCount,
          };
        } catch (error) {
          console.error(`Error fetching comment count for post ${post.id}:`, error);
          return {
            ...post,
            commentCount: 0,
          };
        }
      })
    );

    posts = postsWithCommentCount;

    // Fetch user details
    const userPromises = posts.map(async (post) => {
      if (!post.userId) return post;

      const userRef = doc(db, "users", post.userId);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) return post;

      const userData = userSnapshot.data();
      return {
        ...post,
        userName: userData.name || "Unknown",
        profilePicture: userData.profilePicture || "",
        role: userData.role || "user",
      };
    });

    posts = await Promise.all(userPromises);

    // Fetch bookmarks
    let bookmarkedPosts = new Set();
    if (currentUserId) {
      const bookmarksSnapshot = await getDocs(
        collection(db, `users/${currentUserId}/bookmarks`)
      );
      bookmarksSnapshot.forEach((doc) => {
        bookmarkedPosts.add(doc.data().postId);
      });
    }

    // Add isBookmarked
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
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

module.exports = { getAllPosts };