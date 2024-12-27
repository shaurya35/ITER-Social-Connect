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
  completeProfileSchema,
} = require("../validations/userValidations");
const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");
const { Timestamp } = require("firebase/firestore");

// --- Checks for Valid URL ---
const isValidUrl = (url, platform) => {
  const regexes = {
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
    github: /^https?:\/\/(www\.)?github\.com\/.*$/i,
    x: /^https?:\/\/(www\.)?x\.com\/.*$/i,
  };
  return regexes[platform]?.test(url);
};

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

const sendOtpForgetPassowrd = async (email, otp) => {
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
    subject: "Password Reset OTP",
    text: `You requested a password reset. Use the OTP ${otp} to reset your password. This OTP is valid for 5 minutes. If you didn't request a password reset, please ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
};

// --- Signup Routes (takes email, pass and RegNo and Url as fields) ---
const signup = async (req, res) => {
  try {
    const { email, password, regNo, discordUrl } = req.body;

    if (!email || !password || !regNo || !discordUrl) {
      return res.status(400).json({
        message:
          "Email, password, registration number, and Discord URL are required.",
      });
    }

    // Validate input using Zod or another schema validator
    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    // Check for duplicate email and registration number
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
      return res
        .status(400)
        .json({ message: "Registration number is already taken." });
    }

    // Check if an OTP request is already pending
    const otpDocRef = doc(db, "otp_verifications", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (otpDocSnapshot.exists()) {
      const { otpExpiresAt } = otpDocSnapshot.data();
      const remainingTime = otpExpiresAt - Date.now();

      if (remainingTime > 0) {
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        return res.status(400).json({
          message: `An OTP request is already pending. Please wait ${remainingSeconds} seconds before requesting a new OTP or submit the OTP sent to your email.`,
        });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a new OTP and save it
    const otp = crypto.randomInt(100000, 999999);

    await setDoc(otpDocRef, {
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000, // OTP expires in 5 minutes
      email,
      password: hashedPassword, // Save hashed password
      regNo,
      discordUrl,
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    res
      .status(200)
      .json({ message: "OTP sent successfully. Please check your email." });
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
      return res.status(404).json({
        message:
          "OTP request not found. Please initiate the sign-up process again.",
      });
    }

    const {
      otp: storedOtp,
      otpExpiresAt,
      password,
      regNo,
      discordUrl,
    } = otpDoc.data();

    if (Date.now() > otpExpiresAt) {
      return res.status(400).json({
        message: "OTP has expired. Please initiate the sign-up process again.",
      });
    }

    if (parseInt(otp, 10) !== storedOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please check and try again." });
    }

    await addDoc(collection(db, "verification_requests"), {
      email,
      password,
      regNo,
      discordUrl,
      approved: false,
      profileCompleted: false,
      createdAt: Timestamp.now(), // Add the createdAt field with the current timestamp
    });

    await deleteDoc(doc(db, "otp_verifications", email));

    res.status(200).json({
      message:
        "OTP verified successfully. Please wait for admin approval. You will be notified once your account is approved.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

const completeProfile = async (req, res) => {
  try {
    const { email, password, name, about, github, linkedin, x } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Validate request body with Zod schema
    const validationResult = completeProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      // Check if the error is specifically about `name` or `about`
      const missingFields = validationResult.error.errors
        .filter(
          (error) => error.path.includes("name") || error.path.includes("about")
        )
        .map((error) => error.path[0])
        .join(", ");

      const message = missingFields
        ? `The following fields are required and missing: ${missingFields}`
        : validationResult.error.errors[0].message;

      return res.status(400).json({ message });
    }

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
    const userRef = doc(db, "users", userDoc.id); // Add reference for updating

    // Validate the password using bcrypt
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check if the user's account is approved
    if (!userData.approved) {
      return res.status(403).json({
        message:
          "Your account is not approved. Profile completion is not allowed.",
      });
    }

    // Check if the profile is already completed
    if (userData.profileCompleted) {
      return res.status(200).json({
        message: "Profile is already completed. No updates made.",
      });
    }

    // Validate social media links (if provided)
    if (linkedin && !isValidUrl(linkedin, "linkedin")) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }
    if (github && !isValidUrl(github, "github")) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }
    if (x && !isValidUrl(x, "x")) {
      return res.status(400).json({ message: "Invalid X URL" });
    }

    console.log("check");
    // Update user profile in Firestore
    await updateDoc(userRef, {
      name,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      x: x || "",
      profileCompleted: true,
    });

    const user = {
      email: userData.email,
      userId: userDoc.id,
    };

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
      message: "Profile completed successfully",
      accessToken,
      user,
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({ message: "Failed to complete profile" });
  }
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

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

    if (!userData.profileCompleted) {
      return res.status(200).json({
        message: "Your profile is not completed. Please complete it .",
      });
    }
    const user = {
      email: userData.email,
      userId: userDoc.id,
    };

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
      user,
    });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
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

    const user = {
      email: decoded.email,
      userId: decoded.userId,
    };

    res.status(200).json({ accessToken: newAccessToken, user });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if an OTP request already exists for the email
    const otpDocRef = doc(db, "otps", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (otpDocSnapshot.exists()) {
      const { otpExpiresAt } = otpDocSnapshot.data();
      const remainingTime = otpExpiresAt - Date.now();

      if (remainingTime > 0) {
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        return res.status(400).json({
          message: `An OTP request is already pending. Please wait ${remainingSeconds} seconds before requesting a new OTP or use the OTP sent to your email.`,
        });
      }
    }

    // Generate new OTP and save it to the database
    const otp = generateOtp();
    const otpData = {
      email,
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000, // Expires in 5 minutes
    };

    await setDoc(otpDocRef, otpData); // Save OTP with expiration details

    // Send OTP via email
    await sendOtpForgetPassowrd(email, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

//function to generate a secure random token
const generateResetToken = () => {
  // Generate a random 32-byte token and encode it in hexadecimal format
  return crypto.randomBytes(32).toString("hex");
};

const verifyOtpForForgetPassword = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the OTP is a valid 6-digit number
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        message: "Invalid OTP format. OTP must be a 6-digit number.",
      });
    }

    const otpDocRef = doc(db, "otps", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (!otpDocSnapshot.exists()) {
      return res.status(404).json({ message: "OTP not found or expired" });
    }

    const { otp: savedOtp, expiresAt, used } = otpDocSnapshot.data();

    // Check if the OTP has been marked as used
    if (used) {
      return res.status(400).json({
        message: "This OTP has already been used. Please request a new one.",
      });
    }

    // Check if the OTP has expired
    if (Date.now() > expiresAt) {
      await deleteDoc(otpDocRef); // Clean up expired OTP
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    // Validate the OTP
    if (savedOtp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Mark the OTP as used and generate a reset token
    const resetToken = generateResetToken(); // Create a secure random token
    const resetTokenExpiresAt = Date.now() + 5 * 60 * 1000; // Token valid for 5 minutes

    await setDoc(
      otpDocRef,
      { used: true, resetToken, resetTokenExpiresAt },
      { merge: true }
    );

    res.status(200).json({
      message:
        "OTP verified successfully. Use the reset token to reset your password.",
      resetToken,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword, token } = req.body; // Accept a token with the request

  try {
    // Check if the token exists and is valid
    const otpDocRef = doc(db, "otps", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (!otpDocSnapshot.exists()) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    const { resetToken, resetTokenExpiresAt } = otpDocSnapshot.data();

    // Validate token
    if (token !== resetToken || Date.now() > resetTokenExpiresAt) {
      return res
        .status(403)
        .json({ message: "Invalid or expired reset token" });
    }

    // Check if user exists
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password in the database
    const userDocRef = doc(db, "users", email);
    await setDoc(userDocRef, { password: hashedPassword }, { merge: true });

    // Clean up the OTP reset token to prevent reuse
    await deleteDoc(otpDocRef);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

module.exports = {
  signup,
  completeProfile,
  signin,
  verifyOtp,
  refreshAccessToken,
  logout,
  forgetPassword,
  verifyOtpForForgetPassword,
  resetPassword,
};
