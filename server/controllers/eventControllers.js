const { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    deleteDoc, 
    query, 
    where, 
    getDocs 
  } = require("firebase/firestore");
  const db = require("../firebase/firebaseConfig");
  
  // --- Event Form Submission ---
  const createEvent = async (req, res) => {
    try {
      const { eventTitle, eventType, eventAddress, eventDescription, eventStartTime, eventEndTime, eventLink, eventContact } = req.body;
  
      if (!eventTitle || !eventDescription || !eventContact ) {
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
        createdAt: Date.now(),
      });
  
      res.status(200).json({ message: "Event submitted successfully!" });
    } catch (error) {
      console.error("Submit Event Error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  // --- Get All Events ---
  const getEvent = async (req, res) => {
    try {
      const eventsQuery = query(collection(db, "events"));
      const eventsSnapshot = await getDocs(eventsQuery);
  
      const currentTime = Date.now();
      const events = [];
  
      for (const docSnapshot of eventsSnapshot.docs) {
        const data = docSnapshot.data();
        const timeRemaining = new Date(data.eventEndTime).getTime() - currentTime;
  
        if (timeRemaining <= 0) {
          // Delete expired event
          await deleteDoc(doc(db, "events", docSnapshot.id));
        } else {
          const remainingTimeFormatted = `${Math.floor(timeRemaining / (1000 * 60 * 60))} hours, ${Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))} minutes`;
          events.push({
            id: docSnapshot.id,
            ...data,
            timeRemaining: remainingTimeFormatted,
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
    getEvent
  };
  