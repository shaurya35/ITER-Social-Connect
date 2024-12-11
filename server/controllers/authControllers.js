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
} = require("firebase/firestore");
const { cloudinary } = require("../cloudConfig");
const {
  userSignupSchema,
  userSigninSchema,
} = require("../validations/userValidations");

// URL validation function
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

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userDoc = await addDoc(collection(db, "users"), {
      email,
      password: hashedPassword,
      regNo,
      profileCompleted: false,
    });

    const accessToken = generateAccessToken({ userId: userDoc.id, email });
    const refreshToken = generateRefreshToken({ userId: userDoc.id, email });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful.",
      accessToken,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const completeProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, about, github, linkedin, twitter } = req.body;

    // Validate username uniqueness
    const usernameQuery = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Validate social media links
    if (linkedin && !isValidUrl(linkedin, "linkedin")) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }
    if (github && !isValidUrl(github, "github")) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }
    if (twitter && !isValidUrl(twitter, "twitter")) {
      return res.status(400).json({ message: "Invalid Twitter URL" });
    }

    // Upload profile photo (if provided)
    let profilePhotoUrl = null;
    if (req.file) {
      if (req.file.size > 2 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "Profile photo must not exceed 2 MB" });
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "iter_profiles",
        allowedFormats: ["png", "jpg", "jpeg"],
      });
      profilePhotoUrl = result.secure_url;
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      username,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      profilePhoto: profilePhotoUrl,
      profileCompleted: true,
    });

    res.status(200).json({ message: "Profile completed successfully" });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({ message: "Failed to complete profile" });
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

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
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

module.exports = { signup, completeProfile, signin, refreshAccessToken };
