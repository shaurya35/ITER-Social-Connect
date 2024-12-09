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
const { v4: uuidv4 } = require("uuid");
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
  return regexes[platform].test(url);
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

    // Check for tyhe uniqueness of email and regd
    const emailQuery = query(collection(db, "users"), where("email", "==", email));
    const regNoQuery = query(collection(db, "users"), where("regNo", "==", regNo));
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

    // Validate and upload ID card photo
    // if (!req.file) {
    //   return res.status(400).json({ message: "ID card photo is required" });
    // }

    // if (req.file.size > 2 * 1024 * 1024) {
    //   return res.status(400).json({ message: "ID card photo must not exceed 2 MB" });
    // }

    // const result = await cloudinary.uploader.upload(req.file.path, {
    //   folder: "iter_id_cards",
    //   allowedFormats: ["png", "jpg", "jpeg"],
    // });

    // const idCardPhotoUrl = result.secure_url;

    // Hashed the password
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Add user to db
    const userDoc = await addDoc(collection(db, "users"), {
      email,
      password: hashedPassword,
      regNo,
      idCardPhoto: idCardPhotoUrl,
      profileCompleted: false,
    });

    // Generate JWT token which expires after 24h
    const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "Signup successful. Please complete your profile.",
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//complete profile (added after signup and id card validation)
const completeProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, about, github, linkedin, twitter } = req.body;

    // Validating username uniqueness
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Validating social media links (if provided)
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

    // Update user profile in db
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


//--signin function
const signin = async (req, res) => {
  try {
    const validationResult = userSigninSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password } = req.body;

    // Check if user exists
    const userQuery = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Validate password
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Signin successful",
      token,
      profileCompleted: userData.profileCompleted,
    });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup, completeProfile, signin };
