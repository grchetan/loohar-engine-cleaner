const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_CLOUD_NAME && 
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your-');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage (for Cloudinary/local upload)
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

// Upload buffer to Cloudinary or save locally as fallback
const uploadToCloudinary = (buffer, folder = 'lohar-auto') => {
  if (isCloudinaryConfigured) {
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
  } else {
    // Fallback: save file locally to ../../assets/uploads/
    return new Promise((resolve, reject) => {
      try {
        const uploadDir = path.join(__dirname, '..', '..', 'assets', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.png';
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        resolve(`/assets/uploads/${fileName}`);
      } catch (err) {
        reject(new Error('Local upload fallback failed: ' + err.message));
      }
    });
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  if (imageUrl.includes('cloudinary')) {
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(`lohar-auto/${publicId}`);
  } else if (imageUrl.startsWith('/assets/uploads/')) {
    try {
      const fileName = path.basename(imageUrl);
      const filePath = path.join(__dirname, '..', '..', 'assets', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Failed to delete local file:', err.message);
    }
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
