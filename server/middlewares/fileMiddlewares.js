// const multer = require("multer");
// const { v2: cloudinary } = require("cloudinary");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// // Multer Storage Setup with Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     // Folder in Cloudinary where profile images will be saved
//     folder: "iter_profiles", 
//     allowedFormats: ["jpg", "jpeg", "png"],
//      // Resize image
//     transformation: [{ width: 500, height: 500, crop: "limit" }],
//   },
// });

// // Multer upload middleware
// const upload = multer({
//   storage: storage,
//    // Max file size of 2MB
//   limits: { fileSize: 2 * 1024 * 1024 },
//    // The field name for the profile image in the form data
// }).single("profilePhoto");

// // Middleware to handle file upload and validation
// const fileUploadMiddleware = (req, res, next) => {
//   upload(req, res, (err) => {
//     if (err) {
//       if (err instanceof multer.MulterError) {
//         //error handler for multer
//         return res.status(400).json({ message: err.message });
//       } else {
//         return res.status(500).json({ message: "File upload failed" });
//       }
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // Proceed-to the next middleware or route handle r
//     next();
//   });
// };

// module.exports = fileUploadMiddleware;
