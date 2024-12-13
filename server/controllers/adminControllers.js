require("dotenv").config();
const {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
  getDoc,
  orderBy,
} = require("firebase/firestore");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const db = require("../firebase/firebaseConfig");

const adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { email: process.env.ADMIN_EMAIL },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    return res.status(200).json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

const pendingRequest = async (req, res) => {
  try {
    const pendingQuery = query(
      collection(db, "verification_requests"),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(pendingQuery);

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetch Pending Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch pending requests." });
  }
};

const handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    // Validate request
    if (!requestId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request data." });
    }

    // Fetch the request document
    const requestRef = doc(db, "verification_requests", requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requestData = requestSnapshot.data();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", requestData.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res
        .status(404)
        .json({ message: "User not found with the provided email." });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const userRef = doc(db, "users", userId);

    if (action === "approve") {
      // Approve the request
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: requestData.email,
          subject: "Profile Approval",
          text: "Your account has been approved. You can now complete your profile and explore the app.",
        });

        await updateDoc(userRef, { approvalStatus: "approved" });
        await updateDoc(requestRef, {
          status: "approved",
          handledBy: process.env.ADMIN_EMAIL,
          handledAt: new Date().toISOString(),
        });
        await deleteDoc(requestRef);

        res.status(200).json({
          message: "Request approved, email sent, and request deleted.",
        });
      } catch (emailError) {
        console.error("Email Error:", emailError);
        res.status(500).json({
          message: "Failed to send approval email.",
        });
      }
    } else if (action === "reject") {
      // Reject the request
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: requestData.email,
          subject: "Profile Rejection",
          text: "Your account verification request has been rejected. Please contact support for more details.",
        });

        // Delete the user document
        await deleteDoc(userRef);

        // Update the request document to indicate rejection and delete it
        await updateDoc(requestRef, {
          status: "rejected",
          handledBy: process.env.ADMIN_EMAIL,
          handledAt: new Date().toISOString(),
        });
        await deleteDoc(requestRef);

        res.status(200).json({
          message:
            "Request rejected, user deleted, and email sent successfully.",
        });
      } catch (emailError) {
        console.error("Email Error:", emailError);
        res.status(500).json({
          message: "Failed to send rejection email.",
        });
      }
    }
  } catch (err) {
    console.error("Handle Request Error:", err);
    res.status(500).json({ message: "Failed to handle request." });
  }
};

module.exports = { adminLogin, pendingRequest, handleRequest };
