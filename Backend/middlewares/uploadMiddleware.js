const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration (Local Temporary/Fallback Storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper to upload to Cloudinary or fall back to local serving path
const uploadToCloudinaryOrLocal = async (file) => {
  if (!file) return null;
  
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'apexcart_products',
        use_filename: true,
      });
      // Remove temporary file from local storage after successful upload
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local path:', error);
      // Fallback to local path if Cloudinary fails
      return `/uploads/${file.filename}`;
    }
  } else {
    // Return relative URL for local path serving
    return `/uploads/${file.filename}`;
  }
};

module.exports = {
  upload,
  uploadToCloudinaryOrLocal,
};
