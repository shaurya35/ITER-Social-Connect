const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const supabase = require("../config/supabaseConfig");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("photo"), async (req, res) => {
  // Changed "file" to "photo"
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Compress the image
    const compressedImage = await sharp(req.file.buffer)
      .resize({ width: 500, height: 500, fit: "cover" }) // Good size for profile images
      .jpeg({ quality: 80 }) // 75-85% keeps good quality with smaller size
      .toBuffer();

    const fileName = `${Date.now()}-${req.file.originalname}`;

    // Add metadata (upload timestamp)
    const metadata = { uploadDate: new Date().toISOString() };

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, compressedImage, {
        contentType: "image/jpeg",
        upsert: false, // Avoid overwriting existing files
        cacheControl: "3600", // Optional cache control
        metadata, // Include metadata (timestamp)
      });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
    res.json({ success: true, url: publicUrl, metadata });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
