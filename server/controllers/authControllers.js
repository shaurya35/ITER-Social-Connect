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
  doc
} = require("firebase/firestore");
const { userSignupSchema, userSigninSchema } = require("../validations/userValidations");



// Cloudinary configuration
const { cloudinary } = require("../cloudConfig"); 

// UUID for unique user IDs if needed
const { v4: uuidv4 } = require("uuid"); 

// Signup function
const signup = async (req, res) => {
  try {
    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password, regNo, username, about, github, linkedin, twitter } = req.body;

    // Email already exists (checking)
    const userQuery = query(collection(db, "users"), where("email", "==", email));

    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Registration number already exists (checking)
    const regNoQuery = query(collection(db, "users"), where("regNo", "==", regNo));
    const regNoSnapshot = await getDocs(regNoQuery);
    if (!regNoSnapshot.empty) {
      return res.status(409).json({ message: "Registration number already registered" });
    }

    // Checking if username is unique
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Hashed password
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Upload profile photo to Cloudinary ( if any provided by the student or teacher/prof )
    let profilePhotoUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "iter_profiles",
        allowedFormats: ["png", "jpg", "jpeg"],
      });
      profilePhotoUrl = result.secure_url;
    }

    // Create a new user document in Firestore
    const userDoc = await addDoc(collection(db, "users"), {
      email,
      password: hashedPassword,
      regNo,
      username,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      profilePhoto: profilePhotoUrl,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({ message: "User Signup Successful", token });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Signin function
const signin = async (req, res) => {
  try {
    const validationResult = userSigninSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password } = req.body;

    // Checking if the user exists by email-id
    const userQuery = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Checking if the password matches
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: userDoc.id, email: userData.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({ message: "User signin successful", token });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Profile function
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming userId is in the JWT payload
    const { username, about, github, linkedin, twitter } = req.body;
    const { file } = req;

    // Ensure the username is unique from the others
    const usernameQuery = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(usernameQuery);
    if (!querySnapshot.empty) {
      return res.status(409).json({ message: "Username already taken." });
    }

    // checking URL formats for GitHub, LinkedIn, Twitter (if provided)
    if (github && !/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+$/.test(github)) {
      return res.status(400).json({ message: "Invalid GitHub URL." });
    }
    if (linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/.test(linkedin)) {
      return res.status(400).json({ message: "Invalid LinkedIn URL." });
    }
    if (twitter && !/^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/.test(twitter)) {
      return res.status(400).json({ message: "Invalid Twitter URL." });
    }

    // Upload the profile photo to Cloudinary (if provided)
    let profilePhotoUrl = null;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "iter_profiles",
        allowedFormats: ["png", "jpg", "jpeg"],
      });
      profilePhotoUrl = result.secure_url;
    }

    // Update user profile in Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      username,
      about: about || "",
      github: github || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      profilePhoto: profilePhotoUrl,
    });

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = { signup, signin, updateProfile };
