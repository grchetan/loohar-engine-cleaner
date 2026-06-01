const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your-')
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'lohar-auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary')) return;
  const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
  await cloudinary.uploader.destroy(`lohar-auto/${publicId}`);
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
