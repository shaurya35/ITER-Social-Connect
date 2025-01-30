const { 
    collection, 
    getDocs, 
    query 
  } = require("firebase/firestore");
  const db = require("../firebase/firebaseConfig");

  
  const getNotification = async (req, res) => {
    try {
      const eventsQuery = query(collection(db, "events"));
      const eventsSnapshot = await getDocs(eventsQuery);
  
      const notifications = eventsSnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        title: docSnapshot.data().eventTitle,
        description: docSnapshot.data().eventDescription
      }));
  
      res.status(200).json({ notifications });
    } catch (error) {
      console.error("Get Notifications Error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  module.exports = {
    getNotification
  };
  