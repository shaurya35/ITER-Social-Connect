// connectionControllers.js
const {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  increment,
  deleteDoc,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

// --- Send Connection Request ---
const sendConnectionRequest = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const senderId = req.user.userId;

    if (!targetEmail) {
      return res.status(400).json({ message: "Target email is required." });
    }

    // Find target user by email
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", targetEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    // Prevent self-connections
    if (targetUserId === senderId) {
      return res
        .status(400)
        .json({ message: "You cannot send a connection request to yourself." });
    }

    // Check if connection already exists
    const senderConnectionRef = doc(
      db,
      `users/${senderId}/connections/${targetUserId}`
    );
    const senderConnectionDoc = await getDoc(senderConnectionRef);

    if (senderConnectionDoc.exists()) {
      const status = senderConnectionDoc.data().status;

      if (status === "accepted") {
        return res.status(400).json({ message: "You are already connected!" });
      }

      if (status === "pending") {
        return res
          .status(400)
          .json({ message: "Connection request already pending!" });
      }
    }

    // Get sender details
    const senderRef = doc(db, "users", senderId);
    const senderSnapshot = await getDoc(senderRef);

    let senderName = "Someone";
    let senderProfilePicture = "";

    if (senderSnapshot.exists()) {
      const senderData = senderSnapshot.data();
      senderName = senderData.name || senderName;
      senderProfilePicture = senderData.profilePicture || "";
    }

    // Create connection docs (pending, both sides)
    await setDoc(doc(db, `users/${senderId}/connections/${targetUserId}`), {
      userId: targetUserId,
      status: "pending",
      direction: "sent",
      createdAt: Date.now(),
    });

    await setDoc(doc(db, `users/${targetUserId}/connections/${senderId}`), {
      userId: senderId,
      status: "pending",
      direction: "received",
      createdAt: Date.now(),
    });

    // Send notification
    const notificationRef = doc(collection(db, "notifications"));
    await setDoc(notificationRef, {
      userId: targetUserId,
      message: `You have a new connection request from ${senderName}.`,
      senderId: senderId,
      senderName: senderName,
      senderProfilePicture: senderProfilePicture,
      timestamp: Date.now(),
      isRead: false,
      type: "New Connection",
    });

    res.status(200).json({ message: "Connection request sent successfully!" });
  } catch (error) {
    console.error("Send Connection Request Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Get Connection Requests ---
const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requestsQuery = query(
      collection(db, `users/${userId}/connections`),
      where("status", "==", "pending"),
      where("direction", "==", "received")
    );

    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = [];

    for (const docSnapshot of requestsSnapshot.docs) {
      const connectionData = docSnapshot.data();
      const senderDoc = await getDoc(doc(db, "users", connectionData.userId));

      if (senderDoc.exists()) {
        const senderData = senderDoc.data();
        requests.push({
          requestId: docSnapshot.id,
          senderId: connectionData.userId,
          name: senderData.name,
          email: senderData.email,
          about: senderData.about,
          profilePicture: senderData.profilePicture,
        });
      }
    }

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get Connection Requests Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Respond to Connection Request ---
// const respondToConnectionRequest = async (req, res) => {
//   try {
//     const { targetEmail, action } = req.body;
//     const userId = req.user.userId;

//     if (!targetEmail || !["true", "false"].includes(action)) {
//       return res.status(400).json({ message: "Invalid request!" });
//     }

//     // Find target user by email
//     const usersQuery = query(
//       collection(db, "users"),
//       where("email", "==", targetEmail)
//     );
//     const usersSnapshot = await getDocs(usersQuery);

//     if (usersSnapshot.empty) {
//       return res.status(404).json({ message: "Target user not found." });
//     }

//     const targetUser = usersSnapshot.docs[0];
//     const targetUserId = targetUser.id;

//     // Fetch current user's connection document
//     const senderConnectionRef = doc(
//       db,
//       `users/${userId}/connections/${targetUserId}`
//     );
//     const receiverConnectionRef = doc(
//       db,
//       `users/${targetUserId}/connections/${userId}`
//     );

//     const connSnapshot = await getDoc(senderConnectionRef);
//     if (!connSnapshot.exists()) {
//       return res.status(404).json({ message: "Connection request not found." });
//     }

//     const connData = connSnapshot.data();
//     if (connData.status !== "pending" || connData.direction !== "received") {
//       return res
//         .status(403)
//         .json({ message: "No received request to respond to." });
//     }

//     const status = action === "true" ? "accepted" : "rejected";

//     // Update status in both users' documents
//     await updateDoc(senderConnectionRef, {
//       status,
//       updatedAt: Date.now(),
//     });

//     await updateDoc(receiverConnectionRef, {
//       status,
//       updatedAt: Date.now(),
//     });

//     // If accepted, update connections count
//     if (action === "true") {
//       const senderDocRef = doc(db, "users", userId);
//       const receiverDocRef = doc(db, "users", targetUserId);

//       await updateDoc(senderDocRef, { connectionsCount: increment(1) });
//       await updateDoc(receiverDocRef, { connectionsCount: increment(1) });
//     }

//     // Fetch target user's profile picture
//     const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
//     const targetUserData = targetUserDoc.data();

//     res.status(200).json({
//       message: `Connection request ${status} successfully.`,
//       profilePicture: targetUserData.profilePicture,
//     });
//   } catch (error) {
//     console.error("Respond to Connection Request Error:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };
const respondToConnectionRequest = async (req, res) => {
  try {
    const { targetEmail, action } = req.body;
    const userId = req.user.userId;

    if (!targetEmail || !["true", "false"].includes(action)) {
      return res.status(400).json({ message: "Invalid request!" });
    }

    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", targetEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    const senderConnectionRef = doc(
      db,
      `users/${userId}/connections/${targetUserId}`
    );
    const receiverConnectionRef = doc(
      db,
      `users/${targetUserId}/connections/${userId}`
    );

    const connSnapshot = await getDoc(senderConnectionRef);
    if (!connSnapshot.exists()) {
      return res.status(404).json({ message: "Connection request not found." });
    }

    const connData = connSnapshot.data();
    if (connData.status !== "pending" || connData.direction !== "received") {
      return res
        .status(403)
        .json({ message: "No received request to respond to." });
    }

    const status = action === "true" ? "accepted" : "rejected";

    await updateDoc(senderConnectionRef, { status, updatedAt: Date.now() });
    await updateDoc(receiverConnectionRef, { status, updatedAt: Date.now() });

    if (action === "true") {
      const senderDocRef = doc(db, "users", userId);
      const receiverDocRef = doc(db, "users", targetUserId);
      await updateDoc(senderDocRef, { connectionsCount: increment(1) });
      await updateDoc(receiverDocRef, { connectionsCount: increment(1) });
    }

    // ✅ Delete connection_request notification if rejected
    if (action === "false") {
      const notiQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("senderId", "==", targetUserId),
        where("type", "in", ["connection_request", "New Connection"])
      );
      const snapshot = await getDocs(notiQuery);
      const deletions = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "notifications", docSnap.id))
      );
      await Promise.all(deletions);
    }

    const targetUserDoc = await getDoc(doc(db, "users", targetUserId));
    const targetUserData = targetUserDoc.data();

    res.status(200).json({
      message: `Connection request ${status} successfully.`,
      profilePicture: targetUserData.profilePicture || "",
    });
  } catch (error) {
    console.error("Respond to Connection Request Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Get All Connections (Accepted) ---
const getAllConnections = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Query to fetch all accepted connections
    const connectionsQuery = query(
      collection(db, `users/${userId}/connections`),
      where("status", "==", "accepted")
    );

    const connectionsSnapshot = await getDocs(connectionsQuery);
    const connections = [];

    for (const docSnapshot of connectionsSnapshot.docs) {
      const connectionData = docSnapshot.data();
      const userDoc = await getDoc(doc(db, "users", connectionData.userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        connections.push({
          connectionId: docSnapshot.id,
          userId: connectionData.userId,
          name: userData.name,
          email: userData.email,
          about: userData.about,
          profilePicture: userData.profilePicture,
        });
      }
    }

    res.status(200).json({ connections });
  } catch (error) {
    console.error("Get All Connections Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Remove Connection ---
const removeConnection = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const userId = req.user.userId;

    if (!targetEmail) {
      return res.status(400).json({ message: "Target email is required." });
    }

    // Find target user by email
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", targetEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    // Get connection references
    const userConnectionRef = doc(
      db,
      `users/${userId}/connections/${targetUserId}`
    );
    const targetConnectionRef = doc(
      db,
      `users/${targetUserId}/connections/${userId}`
    );

    // Check if connections exist
    const [userConnectionDoc, targetConnectionDoc] = await Promise.all([
      getDoc(userConnectionRef),
      getDoc(targetConnectionRef),
    ]);

    if (!userConnectionDoc.exists() || !targetConnectionDoc.exists()) {
      return res.status(404).json({ message: "Connection not found." });
    }

    // Get statuses
    const userStatus = userConnectionDoc.data().status;
    const targetStatus = targetConnectionDoc.data().status;

    // Update connection counts if needed
    const userRef = doc(db, "users", userId);
    const targetRef = doc(db, "users", targetUserId);

    const updates = [];

    if (userStatus === "accepted") {
      updates.push(updateDoc(userRef, { connectionsCount: increment(-1) }));
    }
    if (targetStatus === "accepted") {
      updates.push(updateDoc(targetRef, { connectionsCount: increment(-1) }));
    }

    // Delete connection documents
    updates.push(deleteDoc(userConnectionRef));
    updates.push(deleteDoc(targetConnectionRef));

    await Promise.all(updates);

    res.status(200).json({ message: "Connection removed successfully." });
  } catch (error) {
    console.error("Remove Connection Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Get Connection Status ---
const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(200).json({ status: "self" });
    }

    const connectionRef = doc(
      db,
      `users/${userId}/connections/${targetUserId}`
    );
    const connectionDoc = await getDoc(connectionRef);

    if (!connectionDoc.exists()) {
      return res.status(200).json({ status: "none" });
    }

    let { status } = connectionDoc.data();

    // Map 'accepted' status to 'connected' for frontend consistency
    if (status === "accepted") {
      status = "connected";
    }

    return res.status(200).json({ status });
  } catch (error) {
    console.error("Get Connection Status Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
  getAllConnections,
  removeConnection,
  getConnectionStatus,
};
