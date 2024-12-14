const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  userSignupSchema,
  userSigninSchema,
} = require("../validations/userValidations");

const isValidUrl = (url, platform) => {
  const regexes = {
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
    github: /^https?:\/\/(www\.)?github\.com\/.*$/i,
    twitter: /^https?:\/\/(www\.)?twitter\.com\/.*$/i,
  };
  return regexes[platform]?.test(url);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

const signup = async (req, res) => {
  try {
    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password, regNo } = req.body;

    // Check for type uniqueness of email and regd
    const emailQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const regNoQuery = query(
      collection(db, "users"),
      where("regNo", "==", regNo)
    );
    const [emailSnapshot, regNoSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(regNoQuery),
    ]);

    if (!emailSnapshot.empty) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (!regNoSnapshot.empty) {
      return res
        .status(409)
        .json({ message: "Registration number already registered" });
    }

    // Generate OTP for email verification
    const otp = crypto.randomInt(100000, 999999);

    // Store OTP and hashed password temporarily in Firestore
    const hashedPassword = await bcrypt.hash(password, 10);
    const tempUserRef = doc(db, "temp_users", email);
    await setDoc(tempUserRef, {
      email,
      password: hashedPassword,
      regNo,
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
    });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can change this as needed
      auth: {
        user: process.env.EMAIL_USER, // Get email from .env
        pass: process.env.EMAIL_PASS, // Get password from .env
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for email verification is ${otp}. It is valid for 5 minutes.`,
    };

    try {
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.response);
    } catch (error) {
      console.log("Error occurred:", error);
      return res.status(500).json({ message: "Failed to send email." });
    }

    // First, hit the /test endpoint
    const discordBotTestUrl = "https://iter-social-connect.onrender.com/test";
    try {
      const testResponse = await axios.get(discordBotTestUrl);
      if (testResponse.status !== 200) {
        return res
          .status(500)
          .json({ message: "Failed to connect to Discord bot /test endpoint." });
      }
      console.log("Successfully connected to Discord bot /test endpoint.");
    } catch (error) {
      console.error("Error hitting /test endpoint:", error);
      return res
        .status(500)
        .json({ message: "Failed to connect to Discord bot /test endpoint." });
    }

    // Then, upload the ID card photo to /upload
    if (!req.file) {
      return res.status(400).json({ message: "ID card photo is required" });
    }

    const discordBotUploadUrl = "https://iter-social-connect.onrender.com/upload";
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    formData.append("email", email);

    try {
      await axios.post(discordBotUploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      console.log("ID card uploaded to Discord bot successfully.");
    } catch (error) {
      console.error("Error uploading ID card to Discord bot:", error);
      return res
        .status(500)
        .json({ message: "Failed to upload ID card to Discord bot." });
    }

    res.status(200).json({
      message:
        "Signup initiated. Please verify your email to complete the process.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
      profileCompleted: userData.profileCompleted,
    });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Reference to the temp_users collection
    const tempUserRef = doc(db, "temp_users", email);

    // Fetch the document
    const tempUserSnapshot = await getDoc(tempUserRef);

    if (!tempUserSnapshot.exists()) {
      return res
        .status(404)
        .json({ message: "No signup process found for this email." });
    }

    const tempUser = tempUserSnapshot.data();

    // Check if OTP is correct and not expired
    if (tempUser.otp !== parseInt(otp, 10)) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > tempUser.otpExpiresAt) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    await addDoc(collection(db, "users"), {
      email: tempUser.email,
      password: tempUser.password,
      regNo: tempUser.regNo,
      profileCompleted: false,
      approvalStatus: "pending",
    });

    await addDoc(collection(db, "verification_requests"), {
      email: tempUser.email,
      regNo: tempUser.regNo,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    await deleteDoc(tempUserRef);

    res
      .status(200)
      .json({ message: "Verification request submitted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit verification request." });
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
    const { username, about, github, linkedin, twitter } = req.body;

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

    // Validate username uniqueness
    const usernameQuery = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      return res.status(409).json({ message: "Username already taken" });
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
      username,
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
