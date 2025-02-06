// Import Firestore functions
const { collection, getDocs } = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");

const filterByInterest = async (req, res) => {
  try {
    const { interest } = req.query; 

    if (!interest || interest.trim() === "") {
      return res.status(400).json({ error: "Interest field cannot be empty" });
    }

    const normalizedInterest = interest.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const filteredUsers = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        discordUrl: doc.data().discordUrl,
        about: doc.data().about,
        fieldsOfInterest: doc.data().fieldsOfInterest || [],
      }))
      .filter((user) => {
        return user.fieldsOfInterest.some((interestItem) =>
          interestItem.toLowerCase().includes(normalizedInterest)
        );
      });

    if (filteredUsers.length === 0) {
      return res.status(404).json({ message: "No matching users found" });
    }

    res.status(200).json({
      message: "Filtered users retrieved successfully",
      users: filteredUsers,
    });
  } catch (error) {
    console.error("Filter Error:", error);
    res.status(500).json({ error: "Failed to perform filter" });
  }
};

module.exports = { filterByInterest };
