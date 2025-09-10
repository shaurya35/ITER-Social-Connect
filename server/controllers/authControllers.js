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

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"ITER Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email verification code",

    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; font-weight: 500;">Hi there,</h2>
        <p style="font-size: 15px; color: #444;">
          Please use the code below to confirm your email address and continue on <strong>ITER Connect</strong>.
          This code will expire in <strong>5 minutes</strong>. If you don't think you should be receiving this email, you can safely ignore it.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <span style="font-size: 42px; font-weight: bold; color: #000;">${otp}</span>
        </div>

        <hr style="border: none; border-top: 1px solid #ccc;" />

        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          You received this email because you requested a confirmation code from <strong>ITER Connect</strong>.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendOtpForgetPassword = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"ITER Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; font-weight: 500;">Password Reset Request</h2>
        <p style="font-size: 15px; color: #444;">
          Please use the code below to reset your password for <strong>ITER Connect</strong>.
          This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <span style="font-size: 42px; font-weight: bold; color: #000;">${otp}</span>
        </div>

        <hr style="border: none; border-top: 1px solid #ccc;" />

        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          You received this email because a password reset was requested for your account on <strong>ITER Connect</strong>.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const signup = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    // Zod validation with role-based email validation
    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const usersRef = collection(db, "users");
    const emailQuery = query(usersRef, where("email", "==", email));

    const [emailSnapshot] = await Promise.all([getDocs(emailQuery)]);

    if (!emailSnapshot.empty) {
      const existingUser = emailSnapshot.docs[0].data();

      // if (existingUser.profileCompleted === false) {
      //   return res.status(400).json({
      //     message:
      //       "Your account has been created, but the profile is incomplete. Please contact the technical team for assistance.",
      //   });
      // }

      return res.status(400).json({ message: "Email is already taken." });
    }

    const otpDocRef = doc(db, "otp_verifications", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (otpDocSnapshot.exists()) {
      const { otpExpiresAt } = otpDocSnapshot.data();
      const remainingTime = otpExpiresAt - Date.now();

      if (remainingTime > 0) {
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        return res.status(400).json({
          message: `Please wait ${remainingSeconds}s before requesting a new OTP or register with a different email.`,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a new OTP and save it
    const otp = crypto.randomInt(100000, 999999);

    await setDoc(otpDocRef, {
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000, // OTP expires in 5 minutes
      email,
      password: hashedPassword, // Save hashed password
      role,
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

    const otpDocRef = doc(db, "otp_verifications", email);
    const otpDoc = await getDoc(otpDocRef);

    if (!otpDoc.exists()) {
      return res.status(404).json({
        message:
          "OTP request not found. Please initiate the sign-up process again.",
      });
    }

    const { otp: storedOtp, otpExpiresAt, password, role } = otpDoc.data();

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

    // Add the user directly to the users collection
    await addDoc(collection(db, "users"), {
      email,
      password,
      profileCompleted: false,
      createdAt: Timestamp.now(),
      // ...(isStudent ? { regNo, role: "student" } : { role: "teacher" }),
      role,
    });

    // Delete OTP doc after successful verification
    await deleteDoc(otpDocRef);

    res.status(200).json({
      message: "OTP verified successfully. Your account has been created.",
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
      bannerPhoto,
      fieldsOfInterest,
    } = req.body;

    if (!email || !password || !name || !about) {
      const missingFields = [];

      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!name) missingFields.push("name");
      if (!about) missingFields.push("about");

      return res.status(400).json({
        message: `The following required field(s) are missing: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    const predefinedFields = [
      "SIH",
      "Artificial Intelligence",
      "Machine Learning",
      "Data Science",
      "Web Development",
      "Mobile App Development",
      "Cloud Computing",
      "Cybersecurity",
      "Blockchain",
      "Internet of Things (IoT)",
      "Software Engineering",
      "Database Management",
      "Networking",
      "Game Development",
      "DevOps",
      "UI/UX Design",
    ];

    const validationResult = completeProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(
        (error) => error.message
      );

      return res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors: errorMessages,
      });
    }

    // Validate fieldsOfInterest content
    if (fieldsOfInterest && Array.isArray(fieldsOfInterest)) {
      const invalidFields = fieldsOfInterest.filter(
        (field) => !predefinedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          message: "Invalid fields of interest selected.",
          invalidFields,
          validFields: predefinedFields,
        });
      }
    }

    // Check if user exists
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
    const userRef = doc(db, "users", userDoc.id);

    // Validate password
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    if (userData.profileCompleted) {
      return res.status(200).json({
        message: "Profile is already completed. No updates made.",
      });
    }

    // Save profile
    await updateDoc(userRef, {
      name,
      about,
      github: github || "",
      linkedin: linkedin || "",
      x: x || "",
      profilePicture: profilePicture || "",
      bannerPhoto: bannerPhoto || "",
      fieldsOfInterest: Array.isArray(fieldsOfInterest) ? fieldsOfInterest : [],
      profileCompleted: true,
    });

    const user = {
      email: userData.email,
      userId: userDoc.id,
    };

    const accessToken = generateAccessToken({ userId: userDoc.id, email });
    const refreshToken = generateRefreshToken({ userId: userDoc.id, email });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
    const validationResult = userSigninSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password } = req.body;

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
      return res.status(403).json({
        message: "Please complete your profile before logging in.",
      });
    }

    const user = {
      email: userData.email,
      userId: userDoc.id,
      role: userData.role, // Include the role in response
    };

    // Refresh Token System
    const accessToken = generateAccessToken({ userId: userDoc.id, email });
    const refreshToken = generateRefreshToken({ userId: userDoc.id, email });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "Strict",
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
      secure: process.env.NODE_ENV === "production", // Must be true in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Must match how the cookie was set
      path: "/", // Ensure the cookie is removed from the entire site
      // Optional: include the domain if you set it when creating the cookie:
      // domain: process.env.NODE_ENV === "production" ? "your-backend-domain.com" : undefined,
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

    // Check if OTP exists and is not expired
    const otpDocRef = doc(db, "otps", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (otpDocSnapshot.exists()) {
      const { otpExpiresAt } = otpDocSnapshot.data();
      const remainingTime = otpExpiresAt - Date.now();

      if (remainingTime > 0) {
        return res.status(400).json({
          message: `OTP already sent. Wait ${Math.ceil(
            remainingTime / 1000
          )} seconds.`,
        });
      }
    }

    // Generate new OTP
    const otp = generateOtp();
    await setDoc(otpDocRef, {
      email,
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
    });

    await sendOtpForgetPassword(email, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyOtpForForgetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json({
        message: "Invalid OTP format. OTP must be a 6-digit number.",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const otpDocRef = doc(db, "otps", email);
    const otpDocSnapshot = await getDoc(otpDocRef);

    if (!otpDocSnapshot.exists()) {
      return res.status(404).json({ message: "OTP not found or expired" });
    }

    const { otp: savedOtp, otpExpiresAt, used } = otpDocSnapshot.data();

    if (used) {
      return res.status(400).json({
        message: "This OTP has already been used. Please request a new one.",
      });
    }

    if (Date.now() > otpExpiresAt) {
      await deleteDoc(otpDocRef); // Clean up expired OTP
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    if (savedOtp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRef = userSnapshot.docs[0].ref;
    await setDoc(userRef, { password: hashedPassword }, { merge: true });

    // Delete OTP document after successful reset
    await deleteDoc(otpDocRef);

    res.status(200).json({
      message: "Password has been reset successfully and OTP has been cleared.",
    });
  } catch (error) {
    console.error("Error verifying OTP and resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
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
        message: "Email and  password are required.",
      });
    }

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

    const teachersRef = collection(db, "users");
    const emailQuery = query(teachersRef, where("email", "==", email));

    const [emailSnapshot] = await Promise.all([getDocs(emailQuery)]);

    if (!emailSnapshot.empty) {
      return res.status(400).json({ message: "Email is already taken." });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = crypto.randomInt(100000, 999999);

    await setDoc(otpDocRef, {
      otp,
      otpExpiresAt: Date.now() + 5 * 60 * 1000,
      email,
      password: hashedPassword, // Save hashed password
    });

    await sendOtpEmail(email, otp);

    res
      .status(200)
      .json({ message: "OTP sent successfully. Please check your email." });
  } catch (error) {
    console.error("Teacher Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// Get current user profile
const me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get user from database
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    // Return user data
    res.json({
      id: userId,
      userId: userId,
      name: userData.name || userData.fullName || "Unknown User",
      email: userData.email || "",
      avatar: userData.avatar || userData.profilePicture || null,
      profilePicture: userData.profilePicture || userData.avatar || null,
      role: userData.role || userData.userType || "student",
      userType: userData.userType || userData.role || "student",
      isOnline: true,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
  } catch (error) {
    console.error("Error in me endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
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
  me,
};
