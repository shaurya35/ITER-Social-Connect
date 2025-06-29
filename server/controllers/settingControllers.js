const { doc, getDoc, updateDoc } = require("firebase/firestore");
const db = require("../firebase/firebaseConfig");
const {
  updateProfileSchema,
  changePasswordSchema,
} = require("../validations/userValidations");
const bcrypt = require("bcrypt");

// Helper to validate URL format
const isValidUrl = (url, platform) => {
  const regexes = {
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/i,
    github: /^https?:\/\/(www\.)?github\.com\/.*$/i,
    x: /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.*$/i,
  };

  return regexes[platform]?.test(url);
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const validatedData = updateProfileSchema.safeParse(req.body);
    if (!validatedData.success) {
      const errors = validatedData.error.errors.map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors,
      });
    }

    const { name, about, github, linkedin, x, profilePicture } =
      validatedData.data;

    if (linkedin && !isValidUrl(linkedin, "linkedin")) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }
    if (github && !isValidUrl(github, "github")) {
      return res.status(400).json({ message: "Invalid GitHub URL" });
    }
    if (x && !isValidUrl(x, "x")) {
      return res.status(400).json({ message: "Invalid X URL" });
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {
      ...(name && { name }),
      ...(about && { about }),
      ...(github && { github }),
      ...(linkedin && { linkedin }),
      ...(x && { x }),
      ...(profilePicture && { profilePicture }),
    };

    await updateDoc(userRef, updateData);

    const updatedDoc = await getDoc(userRef);
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedDoc.data(),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const validated = changePasswordSchema.safeParse(req.body);
    if (!validated.success) {
      return res
        .status(400)
        .json({ message: validated.error.errors[0].message });
    }

    const { currentPassword, newPassword } = validated.data;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      userData.password
    );
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the current password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateDoc(userRef, { password: hashedPassword });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updateProfile,
  changePassword,
};
