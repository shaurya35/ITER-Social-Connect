require("dotenv").config();
const {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
  getDoc,
  orderBy,
  writeBatch,
  updateDoc,
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

//fix with the hashing password
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch admin credentials from Firestore
    const adminCollection = collection(db, "admin");
    const adminSnapshot = await getDocs(adminCollection);

    let isValidAdmin = false;

    for (const doc of adminSnapshot.docs) {
      const adminData = doc.data();

      if (email === adminData.ADMIN_EMAIL) {
        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(
          password,
          adminData.ADMIN_PASSWORD
        );

        if (isMatch) {
          isValidAdmin = true;
          break;
        }
      }
    }

    if (isValidAdmin) {
      // Generate tokens (you can use your existing token functions here)
      const accessToken = generateAccessToken({ email });
      const refreshToken = generateRefreshToken({ email });

      // Set refresh token as an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
        sameSite: "Strict", // Prevent CSRF attacks
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(200).json({
        message: "Signin successful",
        accessToken,
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
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

    if (!requestId || typeof approved !== "boolean") {
      return res.status(400).json({ message: "Invalid request data." });
    }

    const requestRef = doc(db, "verification_requests", requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return res.status(404).json({ message: "Request not found." });
    }

    const requestData = requestSnapshot.data();
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
      // Determine if the request is for a student (has regNo) or a teacher (no regNo)
      const userData = {
        email: requestData.email,
        password: requestData.password,
        approved: true,
        profileCompleted: false,
        isContributor: false,
        isBetaTester: false,
        isTeacher: requestData.regNo ? false : true, // Assign role
      };

      if (requestData.regNo) {
        userData.regNo = requestData.regNo; // Only for students
      }
      if (requestData.discordUrl) {
        userData.discordUrl = requestData.discordUrl; // Only for students
      }

      await addDoc(usersRef, userData);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: requestData.email,
        subject: "Your Profile Has Been Approved",
        text: `Dear ${requestData.name || "User"},

Congratulations! Your account has been successfully approved.

You can now complete your profile and explore all the features our platform has to offer. To complete your profile, please visit the following link: ${
          process.env.LINK
        }

If you have any questions, feel free to contact our support team.

Best regards,  
Iter Social Connect Team`,
      });

      await deleteDoc(requestRef);

      return res.status(200).json({
        message:
          "Request approved, user added, email sent, and verification request deleted.",
      });
    } else {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: requestData.email,
          subject: "Account Verification Request Rejected",
          text: `Dear ${requestData.name || "User"},

We regret to inform you that your account verification request has been rejected.

Reason: ${comment || "No specific reason was provided."}

If you believe this decision was made in error, please contact our support team.

Sincerely,  
Iter Social Connect Team`,
        });

        await deleteDoc(requestRef);

        return res.status(200).json({
          message:
            "The verification request has been rejected, deleted, and a notification email has been sent to the user.",
        });
      } catch (emailError) {
        console.error("Email Error:", emailError);
        return res
          .status(500)
          .json({ message: "Failed to send rejection email." });
      }
    }
  } catch (err) {
    console.error("Handle Request Error:", err);
    return res.status(500).json({ message: "Failed to handle request." });
  }
};

const deleteOtps = async (req, res) => {
  try {
    const now = Date.now();
    let totalDeletedCount = 0; // Counter for the total number of OTPs deleted

    // Collections to check for expired OTPs
    const collections = ["otp_verifications", "otps"];

    // Loop through the collections to find expired OTPs
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);

      // Query to get expired OTPs based on otpExpiresAt
      const expiredDocsQuery = query(
        collectionRef,
        where("otpExpiresAt", "<", now)
      );
      const expiredDocsSnapshot = await getDocs(expiredDocsQuery);

      if (!expiredDocsSnapshot.empty) {
        // Create a new write batch
        const batch = writeBatch(db);

        // Loop through expired documents and add delete operations to the batch
        expiredDocsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
          totalDeletedCount++; // Increment the count for each OTP deleted
        });

        // Commit the batch
        await batch.commit();

        console.log(
          `Deleted ${expiredDocsSnapshot.size} expired OTP(s) from ${collectionName}`
        );
      } else {
        console.log(`No expired OTPs found in ${collectionName}`);
      }
    }

    // Send a success response with the total count of deleted OTPs
    res.status(200).json({
      message: "Expired OTPs deleted successfully",
      deletedCount: totalDeletedCount,
    });
  } catch (error) {
    console.error("Error deleting expired OTPs:", error);
    res.status(500).json({ error: "Failed to delete expired OTPs" });
  }
};

const getReports = async (req, res) => {
  try {
    // Fetch reports ordered by the 'createdAt' timestamp in ascending order
    const reportsCollection = collection(db, "reports");
    const reportsQuery = query(reportsCollection, orderBy("createdAt", "asc"));
    const reportsSnapshot = await getDocs(reportsQuery);

    const reports = reportsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Count the total number of reports
    const totalReports = reports.length;

    res.status(200).json({ totalReports, reports });
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ message: "Failed to fetch reports." });
  }
};

const getPostReportDetails = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res
        .status(400)
        .json({ message: "postId is required in the request." });
    }

    console.log("Fetching reports for postId:", postId);

    // Query the 'reports' collection for reports on the given post
    const reportsQuery = query(
      collection(db, "reports"),
      where("postId", "==", postId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);

    if (reportsSnapshot.empty) {
      return res
        .status(404)
        .json({ message: "No reports found for this post." });
    }

    const reports = [];
    const userFetchPromises = [];
    let totalReports = 0;

    reportsSnapshot.forEach((docSnapshot) => {
      const report = docSnapshot.data();
      report.id = docSnapshot.id;
      totalReports++;
      reports.push(report);

      // Fetch the details of the user who reported
      const userDocRef = doc(db, "users", report.reportedBy);
      userFetchPromises.push(getDoc(userDocRef));
    });

    const userDocs = await Promise.all(userFetchPromises);

    const detailedReports = reports.map((report, index) => {
      const userDoc = userDocs[index];
      return {
        ...report,
        reportedByUser: userDoc.exists()
          ? { id: userDoc.id, ...userDoc.data() }
          : null,
      };
    });

    // Check if the post exists
    const postDocRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postDocRef);

    // Log if the post exists or not
    console.log("Post exists:", postDoc.exists());

    const postDetails = postDoc.exists()
      ? { id: postDoc.id, ...postDoc.data() }
      : null;

    const detailedReport = {
      postDetails,
      totalReports,
      reports: detailedReports.map((report) => ({
        reason: report.reason,
        commentBy: report.reportedByUser
          ? report.reportedByUser.name
          : "Unknown User",
        userId: report.reportedByUser
          ? report.reportedByUser.id
          : "Unknown User ID",
        createdAt: report.createdAt || "Unknown Date",
      })),
    };

    res.status(200).json({ detailedReport });
  } catch (error) {
    console.error("Error fetching report details:", error.message);
    res.status(500).json({ message: "Failed to fetch report details." });
  }
};

const getUserReportDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId is required in the request." });
    }

    console.log("Fetching reports for userId:", userId);

    // Query the 'reports' collection for reports involving the given user
    const reportsQuery = query(
      collection(db, "reports"),
      where("userIdToReport", "==", userId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);

    if (reportsSnapshot.empty) {
      return res
        .status(404)
        .json({ message: "No reports found for this user." });
    }

    const reports = [];
    const userFetchPromises = [];
    let totalReports = 0;

    reportsSnapshot.forEach((docSnapshot) => {
      const report = docSnapshot.data();
      report.id = docSnapshot.id;
      totalReports++;
      reports.push(report);

      // Fetch the details of the user who reported
      const userDocRef = doc(db, "users", report.reportedBy);
      userFetchPromises.push(getDoc(userDocRef));
    });

    const userDocs = await Promise.all(userFetchPromises);

    const detailedReports = reports.map((report, index) => {
      const userDoc = userDocs[index];
      return {
        ...report,
        reportedByUser: userDoc.exists()
          ? { id: userDoc.id, ...userDoc.data() }
          : null,
      };
    });

    // Fetch details of the user being reported
    const reportedUserDocRef = doc(db, "users", userId);
    const reportedUserDoc = await getDoc(reportedUserDocRef);

    const reportedUserDetails = reportedUserDoc.exists()
      ? {
          id: reportedUserDoc.id,
          email: reportedUserDoc.data().email,
          name: reportedUserDoc.data().name,
          connectionsCount: reportedUserDoc.data().connectionsCount,
          about: reportedUserDoc.data().about,
        }
      : {};

    const detailedReport = {
      reportedUserDetails,
      totalReports,
      reports: detailedReports.map((report) => ({
        reason: report.reason,
        reportedBy: report.reportedByUser
          ? report.reportedByUser.name
          : "Unknown User",
        reporterId: report.reportedByUser
          ? report.reportedByUser.id
          : "Unknown User ID",
        createdAt: report.createdAt || "Unknown Date",
      })),
    };

    res.status(200).json({ detailedReport });
  } catch (error) {
    console.error("Error fetching user report details:", error.message);
    res.status(500).json({ message: "Failed to fetch user report details." });
  }
};

const updateUserBadges = async (req, res) => {
  const { emails, isContributor, isBetaTester } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide a valid list of emails." });
  }

  if (typeof isContributor !== "boolean" || typeof isBetaTester !== "boolean") {
    return res.status(400).json({
      message: "isContributor and isBetaTester must be boolean values.",
    });
  }

  try {
    const usersRef = collection(db, "users");

    for (const email of emails) {
      const userQuery = query(usersRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return res
          .status(404)
          .json({ message: `User with email ${email} not found.` });
      }

      const userDoc = userSnapshot.docs[0];
      const userId = userDoc.id; // Get the userId from Firestore document ID

      // Update user fields
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isContributor,
        isBetaTester,
      });
    }

    return res.status(200).json({ message: "Badges updated successfully." });
  } catch (error) {
    console.error("Error updating badges:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  adminLogin,
  pendingRequest,
  handleRequest,
  deleteOtps,
  getReports,
  getPostReportDetails,
  getUserReportDetails,
  updateUserBadges,
};
