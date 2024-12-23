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

const bcrypt = require("bcrypt");
// --- Generates Access Token for 15min ---
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
};

// --- Generates Refresh Token for 30 days---
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

const adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Refresh Token System
    const accessToken = generateAccessToken({ email: process.env.ADMIN_EMAIL });
    const refreshToken = generateRefreshToken({
      email: process.env.ADMIN_EMAIL,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Signin successful",
      accessToken,
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

const pendingRequest = async (req, res) => {
  try {
    const pendingQuery = query(
      collection(db, "verification_requests"),
      orderBy("createdAt", "asc") // Order by createdAt in ascending order
    );

    const snapshot = await getDocs(pendingQuery);

    const requests = snapshot.docs.map((doc) => {
      const { profileCompleted, approved, createdAt, ...filteredData } =
        doc.data(); // Destructure and exclude unwanted fields
      return {
        id: doc.id,
        ...filteredData,
      };
    });

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetch Pending Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch pending requests." });
  }
};

const handleRequest = async (req, res) => {
  try {
    const { requestId, approved, comment } = req.body;

    // Validate input data
    if (!requestId || typeof approved !== "boolean") {
      return res.status(400).json({ message: "Invalid request data." });
    }

    // Fetch the verification request document
    const requestRef = doc(db, "verification_requests", requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requestData = requestSnapshot.data();

    // Check if the user already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", requestData.email));
    const querySnapshot = await getDocs(q);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    if (approved) {
      // Add user to the users collection
      await addDoc(usersRef, {
        email: requestData.email,
        password: requestData.password,
        regNo: requestData.regNo,
        discordUrl: requestData.discordUrl,
        approved: true,
        profileCompleted: false,
      });

      // Send approval email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: requestData.email,
        subject: "Your Profile Has Been Approved",
        text: `Dear ${requestData.name || "User"},

Congratulations! We are pleased to inform you that your account has been successfully approved.

You can now complete your profile and explore all the features our application has to offer. To complete your profile, please visit the following link: ${
          process.env.LINK
        }

If you have any questions or need assistance, feel free to contact our support team.

Welcome aboard!

Best regards,  
Iter Social Connect Team
`,
      });

      // Delete the verification request
      await deleteDoc(requestRef);

      return res.status(200).json({
        message:
          "Request approved, user added, email sent, and verification request deleted.",
      });
    } else {
      // Rejection handling
      try {
        // Send rejection email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: requestData.email,
          subject: "Account Verification Request Rejected",
          text: `Dear ${requestData.name || "User"},

We regret to inform you that your account verification request has been rejected.

Reason: ${comment || "No specific reason was provided."}

If you believe this decision was made in error or need further assistance, please do not hesitate to reach out to our support team at [Support Email or Phone Number].

Thank you for your interest in Iter Social Connect.

Sincerely,  
Iter Social Connect Team
`,
        });

        await deleteDoc(requestRef);

        return res.status(200).json({
          message:
            "The verification request has been successfully rejected and deleted and a notification email has been sent to the user",
        });
      } catch (emailError) {
        console.error("Email Error:", emailError);
        return res.status(500).json({
          message: "Failed to send rejection email.",
        });
      }
    }
  } catch (err) {
    console.error("Handle Request Error:", err);
    return res.status(500).json({ message: "Failed to handle request." });
  }
};

module.exports = { adminLogin, pendingRequest, handleRequest };
