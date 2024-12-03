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
} = require("../validations/validations");

const signup = async (req, res) => {
  try {
    if (!userSignupSchema.safeParse(req.body).success) {
      return res.status(411).json({
        message: "Input validation failed",
      });
    }
    const { email, password, name } = req.body;
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.size > 0) {
      return res.status(400).send("Email already registered...");
    }
    const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS, 10));
    const hash = await bcrypt.hash(password, salt);
    const docRef = await addDoc(collection(db, "users"), {
      email: email,
      password: hash,
      name: name,
    });
    let token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.status(200).json({
      message: "user signup successfull",
      token: token,
    });
  } catch (e) {
    res.status(411).json({
      message: "Error while Signup",
    });
  }
};

const signin = async (req, res) => {
  if (!userSigninSchema.safeParse(req.body).success) {
    return res.status(411).json({
      message: "Input validation failed",
    });
  }
  try {
    const { email, password } = req.body;

    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.size == 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    querySnapshot.forEach(async (doc) => {
      const userData = doc.data();
      const passCheck = await bcrypt.compare(password, userData.password);

      if (passCheck) {
        let token = jwt.sign(
          { email: userData.email },
          process.env.JWT_SECRET,
          {
            expiresIn: "24h",
          }
        );
        res.status(200).json({
          message: "user signin successfull",
          token: token,
        });
      } else {
        res.status(400).json({
          message: "Incorrect Password",
        });
      }
    });
  } catch (error) {
    res.status(411).json({
      message: "Error while Signin",
    });
  }
};

module.exports = {
  signup,
  signin,
};
