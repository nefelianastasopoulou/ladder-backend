const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudStorage = require('../services/cloudStorage');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload image to cloud storage (S3)
 * @access  Private (requires authentication)
 * @body    multipart/form-data with 'image' field
 * @query   folder (optional) - folder name in S3 (e.g., 'opportunities', 'posts', 'avatars')
 * @returns { url, key, size, mimetype }
 */
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get folder from query param or use default
    const folder = req.query.folder || 'uploads';

    // Upload to cloud storage (S3/Cloudinary/Local based on env)
    const uploadResult = await cloudStorage.uploadFile(req.file, folder);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.url,
        key: uploadResult.key || null,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
});

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete image from cloud storage
 * @access  Private (requires authentication)
 * @body    { url, key }
 * @returns { success, message }
 */
router.delete('/image', authenticateToken, async (req, res) => {
  try {
    const { url, key } = req.body;

    if (!url && !key) {
      return res.status(400).json({ error: 'URL or key required' });
    }

    await cloudStorage.deleteFile(url, key);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: error.message 
    });
  }
});

module.exports = router;

