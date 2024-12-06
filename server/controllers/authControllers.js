const db = require("../firebase/firebaseConfig");
const jwt = require("jsonwebtoken");
const {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} = require("firebase/firestore");
const bcrypt = require("bcrypt");
const {
  userSignupSchema,
  userSigninSchema,
} = require("../validations/userValidations");

const signup = async (req, res) => {
  try {
    const validationResult = userSignupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ message: validationResult.error.errors[0].message });
    }

    const { email, password, regNo } = req.body;

    const userQuery = query(
      collection(db, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const regNoQuery = query(
      collection(db, "users"),
      where("regNo", "==", regNo)
    );
    const regNoSnapshot = await getDocs(regNoQuery);
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
    });

    const token = jwt.sign({ userId: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({ message: "User Signup Successful", token });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

    const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({ message: "User signin successful", token });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup, signin };
