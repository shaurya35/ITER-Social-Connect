const { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

const getNotification = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(currentDate.getDate() - 7);
    const oneWeekAgoTimestamp = Timestamp.fromDate(oneWeekAgo);

    const eventsQuery = query(
      collection(db, "events"),
      where("eventDate", ">=", oneWeekAgoTimestamp)
    );

    const eventsSnapshot = await getDocs(eventsQuery);

    const notifications = eventsSnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      title: docSnapshot.data().eventTitle,
      description: docSnapshot.data().eventDescription,
      date: docSnapshot.data().eventDate.toDate()
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