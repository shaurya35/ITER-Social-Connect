const db = require("../firebase/firebaseConfig"); // Replace with your Firestore setup
const {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

const reportPost = async (req, res) => {
  const { postId, reason } = req.body;

  if (!postId || !reason) {
    return res
      .status(400)
      .json({ message: "Post ID and reason are required." });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: User ID missing." });
  }

  try {
    // Check if the user has already reported this post
    const reportsCollection = collection(db, "reports");
    const reportsSnapshot = await getDocs(
      query(
        reportsCollection,
        where("postId", "==", postId),
        where("reportedBy", "==", userId)
      )
    );

    if (!reportsSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "You have already reported this post." });
    }

    // If no existing report, create a new one
    await addDoc(reportsCollection, {
      postId,
      reportedBy: userId,
      reason,
      createdAt: Timestamp.now(),
      type: "post",
    });

    res.status(200).json({ message: "Post reported successfully." });
  } catch (error) {
    console.error("Error reporting post:", error.message);
    res.status(500).json({ message: "Failed to report post." });
  }
};

const reportUser = async (req, res) => {
  const { userIdToReport, reason } = req.body;

  if (!userIdToReport || !reason) {
    return res
      .status(400)
      .json({ message: "User ID and reason are required." });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: User ID missing." });
  }

  try {
    // Check if the user has already reported this user
    const userReportsCollection = collection(db, "reports");
    const userReportsSnapshot = await getDocs(
      query(
        userReportsCollection,
        where("userIdToReport", "==", userIdToReport),
        where("reportedBy", "==", userId)
      )
    );

    if (!userReportsSnapshot.empty) {
      return res
        .status(400)
        .json({ message: "You have already reported this user." });
    }

    // If no existing report, create a new one
    await addDoc(userReportsCollection, {
      userIdToReport,
      reportedBy: userId,
      reason,
      createdAt: Timestamp.now(),
      type: "user",
    });

    res.status(200).json({ message: "User profile reported successfully." });
  } catch (error) {
    console.error("Error reporting user profile:", error.message);
    res.status(500).json({ message: "Failed to report user profile." });
  }
};

module.exports = { reportPost, reportUser };
