const { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  increment 
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
    const usersQuery = query(collection(db, "users"), where("email", "==", targetEmail));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    // Check if the connection already exists
    const senderConnectionRef = doc(db, `users/${senderId}/connections/${targetUserId}`);
    const senderConnectionDoc = await getDoc(senderConnectionRef);

    if (senderConnectionDoc.exists()) {
      return res.status(400).json({ message: "Connection request already sent!" });
    }

    // Add connection to both users' subcollections
    await setDoc(doc(db, `users/${senderId}/connections/${targetUserId}`), {
      userId: targetUserId,
      status: "pending",
      createdAt: Date.now(),
    });

    await setDoc(doc(db, `users/${targetUserId}/connections/${senderId}`), {
      userId: senderId,
      status: "pending",
      createdAt: Date.now(),
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
      where("status", "==", "pending")
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
const respondToConnectionRequest = async (req, res) => {
  try {
    const { targetEmail, action } = req.body; 
    const userId = req.user.userId;

    if (!targetEmail || !["true", "false"].includes(action)) {
      return res.status(400).json({ message: "Invalid request!" });
    }

    // Find target user by email
    const usersQuery = query(collection(db, "users"), where("email", "==", targetEmail));
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Target user not found." });
    }

    const targetUser = usersSnapshot.docs[0];
    const targetUserId = targetUser.id;

    // Update the connection status in both users' subcollections
    const senderConnectionRef = doc(db, `users/${userId}/connections/${targetUserId}`);
    const receiverConnectionRef = doc(db, `users/${targetUserId}/connections/${userId}`);

    const status = action === "true" ? "accepted" : "rejected";

    await updateDoc(senderConnectionRef, {
      status,
      updatedAt: Date.now(),
    });

    await updateDoc(receiverConnectionRef, {
      status,
      updatedAt: Date.now(),
    });

    // If the request is accepted, update the connections count
    if (action === "true") {
      const senderDocRef = doc(db, "users", userId);
      const receiverDocRef = doc(db, "users", targetUserId);

      // Increment the connections count for both users
      await updateDoc(senderDocRef, { connectionsCount: increment(1) });
      await updateDoc(receiverDocRef, { connectionsCount: increment(1) });
    }

    res.status(200).json({
      message: `Connection request ${status} successfully.`,
    });
  } catch (error) {
    console.error("Respond to Connection Request Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  sendConnectionRequest,
  getConnectionRequests,
  respondToConnectionRequest,
};