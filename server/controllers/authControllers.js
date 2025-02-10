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
  teacherSignupSchema,
} = require("../validations/userValidations");
const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");
const { Timestamp } = require("firebase/firestore");

/** cookie settings  */
const getCookieSettings = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
  domain: process.env.NODE_ENV === "production" ? "vercel.app" : "localhost",
});

//function to generate a random 6 digits otp
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

//function to generate a secure random token
const generateResetToken = () => {
  // Generate a random 32-byte token and encode it in hexadecimal format
  return crypto.randomBytes(32).toString("hex");
};

// --- Generates Access Token for 15min ---
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
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

    const userRefInAdminReq = collection(db, "verification_requests");
    const emailQueryinAdminReq = query(
      userRefInAdminReq,
      where("email", "==", email)
    );

    const [emailSnapshotinAdminReq] = await Promise.all([
      getDocs(emailQueryinAdminReq),
    ]);

    if (!emailSnapshotinAdminReq.empty) {
      return res
        .status(400)
        .json({ message: "This email is already under admin verification." });
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

    // Determine if the user is a student or a teacher
    const isStudent = regNo !== undefined && regNo !== null;
    console.log("checked");

    await addDoc(collection(db, "verification_requests"), {
      email,
      password,
      ...(discordUrl ? { discordUrl } : {}),
      approved: false,
      profileCompleted: false,
      createdAt: Timestamp.now(),
      ...(isStudent ? { regNo } : { isTeacher: true }), // Include regNo for students, role for teachers
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
    const {
      email,
      password,
      name,
      about,
      github,
      linkedin,
      x,
      profilePicture,
      fieldsOfInterest,
      discordUrl,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Validate request body using Zod schema
    const validationResult = completeProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((error) => {
        const field = error.path.join(".");
        return `Field '${field}' is invalid: ${error.message}`;
      });

      return res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors: errorMessages,
      });
    }

    // Query Firestore to check if the user exists
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found." });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userRef = doc(db, "users", userDoc.id); // Reference for updating user profile

    // Validate the password using bcrypt
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password." });
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

    // Ensure fieldsOfInterest is an array before storing
    const interests = Array.isArray(fieldsOfInterest) ? fieldsOfInterest : [];

    // Update user profile in Firestore
    await updateDoc(userRef, {
      name,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      x: x || "",
      profilePicture: profilePicture || "",
      discordUrl: discordUrl || "",
      fieldsOfInterest: interests,
      profileCompleted: true,
    });

    const user = {
      email: userData.email,
      userId: userDoc.id,
    };

    // Generate access and refresh tokens
    const accessToken = generateAccessToken({ userId: userDoc.id, email });
    const refreshToken = generateRefreshToken({ userId: userDoc.id, email });

    // Set secure HTTP-only cookie for refresh token
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "Strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // });

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true, // Not accessible via client-side JS
    //   secure: process.env.NODE_ENV === "production", // True in production (HTTPS)
    //   sameSite: "none", // Necessary for cross-site requests
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    //   path: "/", // Available to all routes
    //   // Optionally, if you need to force the cookie to your backend domain:
    //   // domain: process.env.NODE_ENV === "production" ? "your-backend-domain.com" : undefined,
    // });

    /* latest */
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "none",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    //   path: "/",
    //   domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
    // });

    // ai gen
    res.cookie("refreshToken", refreshToken, getCookieSettings());

    return res.status(200).json({
      message: "Profile completed successfully.",
      accessToken,
      user,
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    return res.status(500).json({ message: "Failed to complete profile." });
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

    /** original */
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "Strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // });

    /* prod error */
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "none",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    //   path: "/",
    // });

    /* latest */
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "none",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    //   path: "/",
    //   domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
    // });

    // ai gen
    res.cookie("refreshToken", refreshToken, getCookieSettings());

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

// const logout = (req, res) => {
//   try {
//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     });

//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Logout Error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const logout = (req, res) => {
  try {
    // res.clearCookie("refreshToken", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production", // Must be true in production
    //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Must match how the cookie was set
    //   path: "/", // Ensure the cookie is removed from the entire site
    //   // Optional: include the domain if you set it when creating the cookie:
    //   // domain: process.env.NODE_ENV === "production" ? "your-backend-domain.com" : undefined,
    // });

    // latest 
    // res.clearCookie("refreshToken", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    //   path: "/",
    //   domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
    // });

    /** ai gen */
    res.clearCookie("refreshToken", getCookieSettings());


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

const teacherSignup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Emailand  password are required.",
      });
    }

    // Validate input using Zod or another schema validator
    const validationResult = teacherSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const teachersRefInAdminReq = collection(db, "verification_requests");
    const emailQueryinAdminReq = query(
      teachersRefInAdminReq,
      where("email", "==", email)
    );

    const [emailSnapshotinAdminReq] = await Promise.all([
      getDocs(emailQueryinAdminReq),
    ]);

    if (!emailSnapshotinAdminReq.empty) {
      return res
        .status(400)
        .json({ message: "This email is already under admin verification." });
    }

    // Check for duplicate email and registration number
    const teachersRef = collection(db, "users");
    const emailQuery = query(teachersRef, where("email", "==", email));

    const [emailSnapshot] = await Promise.all([getDocs(emailQuery)]);

    if (!emailSnapshot.empty) {
      return res.status(400).json({ message: "Email is already taken." });
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
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    res
      .status(200)
      .json({ message: "OTP sent successfully. Please check your email." });
  } catch (error) {
    console.error("Teacher Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
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
  teacherSignup,
};
