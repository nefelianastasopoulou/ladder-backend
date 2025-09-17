# File Storage Setup Guide

## 🚨 Problem
Railway's file system is ephemeral - uploaded files are lost on app restart/redeploy.

## 💡 Solutions

### Option 1: Railway Persistent Volumes (Easiest)
✅ **Already configured in `railway.json`**

**Setup:**
1. Deploy to Railway
2. Railway will automatically create a persistent volume
3. Files will be stored in `/app/backend/uploads`
4. Set environment variable: `STORAGE_TYPE=local`

**Pros:** Simple, no external dependencies
**Cons:** Limited to Railway, not scalable for high traffic

---

### Option 2: AWS S3 (Recommended for Production)

**Setup:**
1. Create AWS S3 bucket
2. Create IAM user with S3 permissions
3. Set environment variables in Railway:
   ```
   STORAGE_TYPE=s3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

**IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**Pros:** Scalable, reliable, CDN support
**Cons:** Costs money, requires AWS setup

---

### Option 3: Cloudinary (Best for Images)

**Setup:**
1. Create Cloudinary account
2. Get API credentials
3. Set environment variables in Railway:
   ```
   STORAGE_TYPE=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**Pros:** Image optimization, transformations, CDN
**Cons:** Costs money, image-focused

---

## 🔧 Implementation Details

### File Upload Flow:
1. File uploaded to temporary local storage
2. Cloud storage service processes the file
3. File uploaded to chosen storage provider
4. Local temporary file deleted
5. Database stores the cloud URL

### Supported File Types:
- Images: JPEG, PNG, GIF, WebP
- Max size: 5MB
- Automatic validation and sanitization

### File Organization:
- Community posts: `community-posts/`
- Platform posts: `platform-posts/`
- User avatars: `avatars/`

## 🚀 Quick Start

### For Development:
```bash
# No additional setup needed
# Files stored locally in ./uploads
```

### For Production (Railway + S3):
1. Set up AWS S3 bucket
2. Add environment variables to Railway
3. Deploy - files will automatically use S3

### For Production (Railway + Cloudinary):
1. Set up Cloudinary account
2. Add environment variables to Railway
3. Deploy - files will automatically use Cloudinary

## 📋 Environment Variables

### Required for all setups:
- `STORAGE_TYPE` (local/s3/cloudinary)

### For S3:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`

### For Cloudinary:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 🔍 Testing

Test file uploads with:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Post" \
  -F "content=Test content" \
  -F "image=@test-image.jpg" \
  http://your-app.railway.app/api/posts
```

## 🛠️ Troubleshooting

### Common Issues:
1. **Files not uploading**: Check storage type and credentials
2. **Files not accessible**: Verify CORS settings for S3/Cloudinary
3. **Large files failing**: Check file size limits (5MB max)

### Debug Mode:
Set `LOG_LEVEL=debug` to see detailed upload logs
