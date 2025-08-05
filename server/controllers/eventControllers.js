const {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const { pushNotification } = require("../helpers/liveNotificationService")

// --- Event Form Submission ---
const createEvent = async (req, res) => {
  try {
    const {
      eventTitle,
      eventType,
      eventAddress,
      eventDescription,
      eventStartTime,
      eventEndTime,
      eventLink,
      eventContact,
    } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Fetch user data from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userSnap.data();

    // Check if the user is a teacher
    if (userData.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create events." });
    }

    if (!eventTitle || !eventDescription || !eventContact) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Save event data to Firestore
    const newEventRef = doc(collection(db, "events"));
    await setDoc(newEventRef, {
      eventTitle,
      eventDescription,
      eventType,
      eventAddress,
      eventStartTime,
      eventEndTime,
      eventLink,
      eventContact,
      createdBy: userId,
      createdAt: Date.now(),
    });

    const usersSnapshot = await getDocs(collection(db, "users"));
    const batch = writeBatch(db);

    usersSnapshot.forEach((user) => {
      const recipientId = user.id;
      const notificationRef = doc(collection(db, "notifications"));

      batch.set(notificationRef, {
        userId: recipientId,
        senderId: userId,
        senderName: userData.name || "Unknown",
        senderProfilePicture: userData.profilePicture || "",
        message: `New Event Created: ${eventTitle}`,
        eventId: newEventRef.id,
        timestamp: Date.now(),
        isRead: false,
        type: "event",
      });
    });

    await batch.commit();
    pushNotification(recipientId, notificationData.message);

    res.status(200).json({ message: "Event submitted successfully!" });
  } catch (error) {
    console.error("Submit Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required." });
    }

    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { isRead: true });

    res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// --- Get All Events ---
const getEvents = async (req, res) => {
  try {
    const eventsQuery = query(collection(db, "events"));
    const eventsSnapshot = await getDocs(eventsQuery);

    const currentTime = Date.now();
    const events = [];

    for (const docSnapshot of eventsSnapshot.docs) {
      const data = docSnapshot.data();
      const timeRemainingMs = new Date(data.eventEndTime).getTime() - currentTime;

      if (timeRemainingMs <= 0) {
        // Delete expired event
        await deleteDoc(doc(db, "events", docSnapshot.id));
      } else {
        // Convert timeRemaining to days, hours, and minutes
        const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

        let remainingTimeFormatted = "";
        if (days > 0) remainingTimeFormatted += `${days} day${days > 1 ? "s" : ""} `;
        if (hours > 0) remainingTimeFormatted += `${hours} hour${hours > 1 ? "s" : ""} `;
        if (minutes > 0) remainingTimeFormatted += `${minutes} minute${minutes > 1 ? "s" : ""}`;

        events.push({
          id: docSnapshot.id,
          ...data,
          timeRemaining: remainingTimeFormatted.trim(),
        });
      }
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


module.exports = {
  createEvent,
  getEvents,
  markNotificationAsRead,
};
