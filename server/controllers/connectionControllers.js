const {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
  } = require("firebase/firestore");
  const db = require("../firebase/firebaseConfig");
  
  // --- Send Connection Request ---
  const sendConnectionRequest = async (req, res) => {
    try {
      console.log("Decoded user:", req.user);
      const { targetUserId } = req.body;
      const senderId = req.user.userId;
  
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required." });
      }
  
      // Check if a connection request already exists
      const connectionQuery = query(
        collection(db, "connections"),
        where("sender", "==", senderId),
        where("receiver", "==", targetUserId)
      );

      const connectionSnapshot = await getDocs(connectionQuery);
  
      if (!connectionSnapshot.empty) {
        return res.status(400).json({ message: "Connection request already sent!" });
      }
  
      // Create a new connection request
      await addDoc(collection(db, "connections"), 
      {
        sender: senderId,
        receiver: targetUserId,
        status: "pending",
        createdAt: Date.now(),
      });
  
      res.status(200).json({ message: "Connection request sent successfully!" });

    }
    catch(error) 
    {
      console.error("Send Connection Request Error:", error);

      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  // --- Get Connection Requests ---
  const getConnectionRequests = async (req, res) => 
    {
    try {
      const userId = req.user.userId;
  
  // Fetch all pending connection requests for the logged-in user
      const requestsQuery = query(
        collection(db, "connections"),
        where("receiver", "==", userId),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
  
      if (requestsSnapshot.empty) 
        {
        return res.status(200).json({ requests: [] });
      }
  
  // Fetch sender details
      const requests = [];
      for (const docSnapshot of requestsSnapshot.docs) 
        {
        const connectionData = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, "users", connectionData.sender));
  
        if (senderDoc.exists()) 
        {
          const senderData = senderDoc.data();
          requests.push({
            requestId: docSnapshot.id,
            senderId: connectionData.sender,
            name: senderData.name,
            about: senderData.about,
          });
        }
      }
  
      res.status(200).json({ requests });
    }
     catch (error)
    {
      console.error("Get Connection Requests Error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  // --- Respond to Connection Request ---
  const respondToConnectionRequest = async (req, res) => {
    try 
    {
      const { requestId, action } = req.body;

      if (!requestId || !["accept","reject"].includes(action)) 
      {
        return res.status(400).json({ message: "Invalid request!" });
      }


      const connectionRef = doc(db, "connections", requestId);
      
      const connectionDoc = await getDoc(connectionRef);
  
      if (!connectionDoc.exists()) {
        return res.status(404).json({ message: "Connection request not found." });
      }
  
      const connectionData = connectionDoc.data();
  
  // Ensure the logged-in user is the receiver of the request

      if (connectionData.receiver !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized action." });
      }

      // Update the connection status

      await updateDoc(connectionRef, {
        status: action === "accept" ? "accepted" : "rejected",
        updatedAt: Date.now(),
      });
  

      res.status(200).json({
        message: `Connection request ${action}ed successfully.`,
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
  