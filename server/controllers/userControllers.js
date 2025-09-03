require("dotenv").config();
const db = require("../firebase/firebaseConfig");
const {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  startAfter, // ADD THIS
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  orderBy,
  limit,
  writeBatch,
  setDoc,
} = require("firebase/firestore");
require("dotenv").config();
const { pushNotification } = require("../helpers/liveNotificationService");

const jwt = require("jsonwebtoken");

const getAllUserPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit: limitParam = 10, lastDocId } = req.query;
    const limitValue = parseInt(limitParam, 10);

    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnapshot.data();
    const postsCollection = collection(db, "posts");

    // Base query with required ordering
    let postsQuery = query(
      postsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      orderBy("__name__"), // Required for pagination stability
      limit(limitValue)
    );

    // Add cursor for pagination
    if (lastDocId) {
      const lastDocRef = doc(db, "posts", lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      postsQuery = query(postsQuery, startAfter(lastDocSnap));
    }

    const [postsSnapshot, bookmarksSnapshot] = await Promise.all([
      getDocs(postsQuery),
      getDocs(collection(db, `users/${userId}/bookmarks`)),
    ]);

    const bookmarkedPosts = new Set(
      bookmarksSnapshot.docs.map((doc) => doc.data().postId)
    );

    const posts = [];
    let lastVisible = null;

    postsSnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        category: doc.data().category || "Uncategorized",
        userName: userData.name,
        profilePicture: userData.profilePicture || "",
        isBookmarked: bookmarkedPosts.has(doc.id),
      });
      lastVisible = doc;
    });

    const hasMore = posts.length === limitValue;
    const nextLastDocId = hasMore ? lastVisible.id : null;

    res.status(200).json({
      message: "Posts retrieved successfully",
      posts,
      hasMore,
      lastDocId: nextLastDocId,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);

    // Special handling for index errors
    if (error.code === "failed-precondition") {
      const indexUrl = error.message.match(/https:\/\/[^ ]+/)?.[0] || "";
      return res.status(400).json({
        error: "Index missing",
        solution: indexUrl,
      });
    }

    res.status(500).json({ error: "Failed to fetch user posts" });
  }
};

const createUserPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, category } = req.body;

    const allowedCategories = [
      "general",
      "sih",
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

// const likePost = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { postId } = req.body;

//     if (!postId) {
//       return res.status(400).json({ error: "Post ID is required" });
//     }

//     const postRef = doc(db, "posts", postId);
//     const postSnapshot = await getDoc(postRef);

//     if (!postSnapshot.exists()) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     const postData = postSnapshot.data();
//     const postOwnerId = postData.userId;

//     let likes = postData.likes || [];
//     const userIndex = likes.indexOf(userId);
//     const userAlreadyLiked = userIndex !== -1;

//     if (userAlreadyLiked) {
//       likes.splice(userIndex, 1);

//       // Delete the previous notification when unliking
//       const q = query(
//         collection(db, "notifications"),
//         where("userId", "==", postOwnerId),
//         where("senderId", "==", userId),
//         where("postId", "==", postId),
//         where("type", "==", "like")
//       );
//       const notificationSnapshot = await getDocs(q);
//       notificationSnapshot.forEach(async (doc) => {
//         await deleteDoc(doc.ref);
//       });
//     } else {
//       likes.push(userId);

//       const userRef = doc(db, "users", userId);
//       const userSnapshot = await getDoc(userRef);

//       if (userSnapshot.exists() && postOwnerId !== userId) {
//         const userData = userSnapshot.data();

//         // Check if a like notification already exists
//         const q = query(
//           collection(db, "notifications"),
//           where("userId", "==", postOwnerId),
//           where("senderId", "==", userId),
//           where("postId", "==", postId),
//           where("type", "==", "like")
//         );

//         const notificationSnapshot = await getDocs(q);

//         if (notificationSnapshot.empty) {
//           // Only create a new notification if it doesn't exist
//           const notificationRef = doc(collection(db, "notifications"));
//           await setDoc(notificationRef, {
//             userId: postOwnerId,
//             senderId: userId,
//             senderName: userData.name || "Unknown",
//             senderProfilePicture: userData.profilePicture || "",
//             message: `${userData.name} liked your post.`,
//             postId: postId,
//             timestamp: Date.now(),
//             isRead: false,
//             type: "like",
//           });
//         }
//       }
//     }

//     // Update the post with the new likes array and like count
//     await updateDoc(postRef, {
//       likes,
//       likeCount: likes.length,
//     });

//     res.status(200).json({
//       message: userAlreadyLiked
//         ? "Post unliked successfully"
//         : "Post liked successfully",
//       totalLikes: likes.length,
//     });
//   } catch (error) {
//     console.error("Like Post Error:", error);
//     res.status(500).json({ error: "Failed to like the post" });
//   }
// };

const likePost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: "Post ID is required" });

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists())
      return res.status(404).json({ error: "Post not found" });

    const postData = postSnap.data();
    const postOwnerId = postData.userId;

    let likes = Array.isArray(postData.likes) ? [...postData.likes] : [];
    const alreadyLiked = likes.includes(userId);

    let sendPush = false;
    let likerData;

    if (alreadyLiked) {
      likes = likes.filter((id) => id !== userId);
      const notifQ = query(
        collection(db, "notifications"),
        where("userId", "==", postOwnerId),
        where("senderId", "==", userId),
        where("postId", "==", postId),
        where("type", "==", "like")
      );
      const snap = await getDocs(notifQ);
      snap.forEach((d) => deleteDoc(d.ref));
    } else {
      likes.push(userId);
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists() && postOwnerId !== userId) {
        likerData = userSnap.data();
        const notifQ = query(
          collection(db, "notifications"),
          where("userId", "==", postOwnerId),
          where("senderId", "==", userId),
          where("postId", "==", postId),
          where("type", "==", "like")
        );
        const snap = await getDocs(notifQ);
        if (snap.empty) {
          await setDoc(doc(collection(db, "notifications")), {
            userId: postOwnerId,
            senderId: userId,
            senderName: likerData.name || "Unknown",
            senderProfilePicture: likerData.profilePicture || "",
            message: `${likerData.name} liked your post. View Post`,
            postId,
            link: `/post/${postId}`,
            timestamp: Date.now(),
            isRead: false,
            type: "like",
          });
          sendPush = true;
        }
      }
    }

    await updateDoc(postRef, {
      likes,
      likeCount: likes.length,
    });

    if (sendPush && likerData) {
      // pushNotification(postOwnerId, {
      //   title: "👏 New Like!",
      //   body:  `${likerData.name} liked your post.`,
      //   data:  { postId, url: `/post/${postId}` },
      // });
      pushNotification(postOwnerId, {
        title: `${likerData.name} liked your post`,
        body: `Tap to view your post.`,
        data: { postId, url: `/notifications` },
      });
    }

    return res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      totalLikes: likes.length,
    });
  } catch (error) {
    console.error("Like Post Error:", error);
    return res.status(500).json({ error: "Failed to like the post" });
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
      return res.status(200).json({
        message: "No bookmarks found",
        bookmarks: [],
      });
    }

    const postsRef = collection(db, "posts");
    const bookmarkedPosts = [];

    for (const bookmarkDoc of bookmarksSnapshot.docs) {
      const postId = bookmarkDoc.data().postId;
      const postDoc = await getDoc(doc(postsRef, postId));

      if (postDoc.exists()) {
        const postData = postDoc.data();
        const postUserId = postData.userId; // Get userId of post creator

        // Fetch the post creator's data
        const postUserRef = doc(db, "users", postUserId);
        const postUserDoc = await getDoc(postUserRef);

        let name = "Unknown"; // Default if user not found
        let profilePicture = "";

        if (postUserDoc.exists()) {
          const postUserData = postUserDoc.data();
          name = postUserData.name || "Unknown";
          profilePicture = postUserData.profilePicture || "";
        }

        bookmarkedPosts.push({
          id: postDoc.id,
          ...postData,
          name,
          profilePicture,
        });
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

const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { profilePicture } = req.body;
    if (!profilePicture) {
      return res.status(400).json({ message: "profilePicture is required." });
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { profilePicture });

    return res
      .status(200)
      .json({ message: "Profile photo updated successfully." });
  } catch (error) {
    console.error("Update Profile Photo Error:", error);
    return res.status(500).json({ message: "Failed to update profile photo." });
  }
};

const updateBannerPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { bannerPhoto } = req.body;
    if (!bannerPhoto) {
      return res.status(400).json({ message: "bannerPhoto is required." });
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { bannerPhoto });

    return res
      .status(200)
      .json({ message: "Banner photo updated successfully." });
  } catch (error) {
    console.error("Update Banner Photo Error:", error);
    return res.status(500).json({ message: "Failed to update banner photo." });
  }
};

const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    // Use the new Firebase v9+ modular SDK syntax
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    res.json({
      id: userId,
      name: userData.name || "Unknown",
      avatar: userData.profilePicture || userData.avatar || null,
      email: userData.email || null,
      profilePicture: userData.profilePicture || null, // Include both for compatibility
    });
  } catch (error) {
    console.error("🔥 Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
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
  updateProfilePhoto,
  updateBannerPhoto,
  getUserById,
};
