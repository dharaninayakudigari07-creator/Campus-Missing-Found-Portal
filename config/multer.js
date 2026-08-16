const multer = require("multer");

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================
// The image is temporarily stored in memory.
// This allows the controller to access:
// req.file.buffer
//
// The buffer is then uploaded directly to Cloudinary.
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP and GIF images are allowed."
      ),
      false
    );
  }
};

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

module.exports = upload;