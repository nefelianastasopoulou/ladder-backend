const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

class CloudStorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local'; // 'local', 's3', 'cloudinary'
  }

  // Upload file to cloud storage
  async uploadFile(file, folder = 'uploads') {
    try {
      if (this.storageType === 's3') {
        return await this.uploadToS3(file, folder);
      } else if (this.storageType === 'cloudinary') {
        return await this.uploadToCloudinary(file, folder);
      } else {
        return await this.uploadLocally(file, folder);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Upload to AWS S3
  async uploadToS3(file, folder) {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype
      // Removed ACL: 'public-read' for private bucket
    };

    const result = await s3.upload(uploadParams).promise();
    
    // Clean up local file
    fs.unlinkSync(file.path);
    
    return {
      url: result.Location,
      key: fileName, // Store the S3 key for generating signed URLs
      size: file.size,
      mimetype: file.mimetype
    };
  }

  // Upload to Cloudinary
  async uploadToCloudinary(file, folder) {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto'
    });

    // Clean up local file
    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      size: result.bytes,
      mimetype: result.resource_type
    };
  }

  // Upload locally (for development or with persistent volumes)
  async uploadLocally(file, folder) {
    const uploadDir = path.join(__dirname, '..', 'uploads', folder);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Move file to final location
    fs.renameSync(file.path, filePath);

    return {
      url: `/uploads/${folder}/${fileName}`,
      path: filePath,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  // Delete file from cloud storage
  async deleteFile(fileUrl, fileKey = null) {
    try {
      if (this.storageType === 's3' && fileKey) {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileKey }).promise();
      } else if (this.storageType === 'cloudinary' && fileKey) {
        const cloudinary = require('cloudinary').v2;
        await cloudinary.uploader.destroy(fileKey);
      } else if (this.storageType === 'local') {
        const filePath = path.join(__dirname, '..', fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Get file info
  async getFileInfo(fileUrl, fileKey = null) {
    try {
      if (this.storageType === 's3' && fileKey) {
        const result = await s3.headObject({ Bucket: BUCKET_NAME, Key: fileKey }).promise();
        return {
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType
        };
      } else if (this.storageType === 'local') {
        const filePath = path.join(__dirname, '..', fileUrl);
        const stats = fs.statSync(filePath);
        return {
          size: stats.size,
          lastModified: stats.mtime,
          contentType: 'application/octet-stream'
        };
      }
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }

  // Generate signed URL for private S3 files
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      if (this.storageType === 's3') {
        const params = {
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Expires: expiresIn // URL expires in 1 hour by default
        };
        
        const signedUrl = s3.getSignedUrl('getObject', params);
        return signedUrl;
      } else {
        // For local storage, return the direct URL
        return fileKey;
      }
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }
}

module.exports = new CloudStorageService();
