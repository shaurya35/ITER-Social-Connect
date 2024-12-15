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
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  userSignupSchema,
  userSigninSchema,
} = require("../validations/userValidations");
const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");

// --- Checks for Valid URL --- 
const isValidUrl = (url, platform) => {
  const regexes = {
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
    github: /^https?:\/\/(www\.)?github\.com\/.*$/i,
    twitter: /^https?:\/\/(www\.)?twitter\.com\/.*$/i,
  };
  return regexes[platform]?.test(url);
};

// --- Generates Access Token for 15min ---
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
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

// --- Function to send email with nodemailer --- //
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

// --- Signup Routes (takes email, pass and RegNo and Url as fields) ---
const signup = async (req, res) => {
  try {
    const { email, password, regNo, discordUrl } = req.body;

    if (!email || !password || !regNo || !discordUrl) {
      return res.status(400).json({ message: "Email, password, and regNo and Photo are required." });
    }

    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const usersRef = collection(db, "users");
    const emailQuery = query(usersRef, where("email", "==", email));
    const regNoQuery = query(usersRef, where("regNo", "==", regNo));

    const [emailSnapshot, regNoSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(regNoQuery),
    ]);

    if (!emailSnapshot.empty) {
      return res.status(400).json({ message: "Email is already taken." });
    }

    if (!regNoSnapshot.empty) {
      return res.status(400).json({ message: "Registration number is already taken." });
    }

    const otp = crypto.randomInt(100000, 999999);

    await setDoc(doc(db, "otp_verifications", email), {
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000, 
      email,
      password,
      regNo,
      discordUrl,
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully. Please check your email." });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// --- Final Function to verify otp (keeping email, pass in temp database) ---
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }
     const otpDoc = await getDoc(doc(db, "otp_verifications", email));
     if (!otpDoc.exists()) {
       return res.status(404).json({ message: "OTP request not found. Please try signing up again." });
     }
 
     const { otp: storedOtp, otpExpiresAt, password, regNo, discordUrl } = otpDoc.data();
 
     if (Date.now() > otpExpiresAt) {
       return res.status(400).json({ message: "OTP has expired. Please try signing up again." });
     }
 
     if (parseInt(otp, 10) !== storedOtp) {
       return res.status(400).json({ message: "Invalid OTP. Please try again." });
     }
 
     const hashedPassword = await bcrypt.hash(password, 10);
     await addDoc(collection(db, "users"), {
       email,
       password: hashedPassword,
       regNo,
       discordUrl,
       approved: false,
     });

     await deleteDoc(doc(db, "otp_verifications", email));
    res.status(200).json({
      message: "OTP verified successfully. User created.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};


const completeProfile = async (req, res) => {
  try {
    // Decode and verify the JWT token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId;
    const { name, about, github, linkedin, twitter } = req.body;

    // Fetch the user document
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userSnapshot.data();

    // Check if the profile is already completed
    if (userData.profileCompleted) {
      return res.status(200).json({
        message: "Profile is already completed. No updates made.",
      });
    }

    // Check if the user's account is approved
    if (userData.approvalStatus !== "approved") {
      return res.status(403).json({
        message:
          "Your account is not approved. Profile completion is not allowed.",
      });
    }

    // Validate social media links (if provided)
    if (linkedin && !isValidUrl(linkedin, "linkedin")) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }
    if (github && !isValidUrl(github, "github")) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }
    if (twitter && !isValidUrl(twitter, "twitter")) {
      return res.status(400).json({ message: "Invalid Twitter URL" });
    }

    // Update user profile in Firestore
    await updateDoc(userRef, {
      name,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      profileCompleted: true,
    });

    // Generate a new JWT token upon successful profile completion
    const newToken = jwt.sign(
      { userId, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Profile completed successfully",
      token: newToken, // Include the new token in the response
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({ message: "Failed to complete profile" });
  }
};

const signin = async (req, res) => {
  try {
    // Validate the request body using zod or any schema validation library
    const validationResult = userSigninSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password } = req.body;

    // Query Firestore to check if the user exists
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Validate the password using bcrypt
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check if the account has been approved
    if (userData.approvalStatus !== "approved") {
      return res
        .status(403)
        .json({ message: "Your account has not been approved by the admin." });
    }

    // Check if the profile has been completed
    if (!userData.profileCompleted) {
      const tokenUserid = jwt.sign(
        { userId: userDoc.id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.status(200).json({
        message: "Your profile is not completed. Please complete it.",
        requiresProfileCompletion: true,
        token: tokenUserid, // Send user ID for completing profile
      });
    }

    // Refresh Token System
    const accessToken = generateAccessToken({ userId: userDoc.id, email });
    const refreshToken = generateRefreshToken({ userId: userDoc.id, email });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Signin successful",
      accessToken,
      // profileCompleted: userData.profileCompleted,
    });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

module.exports = {
  signup,
  completeProfile,
  signin,
  verifyOtp,
  refreshAccessToken,
};
