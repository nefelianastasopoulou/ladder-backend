# 🚂 Railway Deployment Setup Guide

This guide will help you deploy your Ladder app to Railway with all the necessary environment variables and configurations.

## 📋 Prerequisites

- Railway account (free tier available)
- GitHub repository with your code
- PostgreSQL database (Railway provides this)

## 🚀 Step 1: Deploy Backend to Railway

### 1.1 Create New Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `backend` folder as the root directory

### 1.2 Configure Backend Environment Variables

In your Railway project settings, add these environment variables:

```bash
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn

# Database (Railway will provide this)
DATABASE_URL=postgresql://postgres:password@host:port/railway

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d
JWT_ISSUER=ladder-backend
JWT_AUDIENCE=ladder-app

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (update with your frontend URL)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Security
TRUST_PROXY=true

# File Storage
STORAGE_TYPE=local
# OR for AWS S3:
# STORAGE_TYPE=s3
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
# AWS_REGION=us-east-1
# AWS_S3_BUCKET_NAME=your-bucket

# Database SSL
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

### 1.3 Generate JWT Secret

Run this command locally to generate a secure JWT secret:

```bash
cd backend
npm run generate-jwt-secret
```

Copy the generated secret and add it as `JWT_SECRET` in Railway.

## 🎯 Step 2: Deploy Frontend to Railway

### 2.1 Create Frontend Project

1. Create another Railway project
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select the root directory (not backend folder)

### 2.2 Configure Frontend Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Ladder
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Feature Flags
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

## 🗄️ Step 3: Database Setup

### 3.1 Add PostgreSQL Service

1. In your Railway backend project
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will automatically provide the `DATABASE_URL`

### 3.2 Run Database Migrations

After deployment, run migrations:

```bash
# Connect to your Railway backend
railway run --service backend npm run migrate
```

## 🔧 Step 4: Configuration Files

### 4.1 Update Railway Configuration

Create or update `railway.json` in your project root:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4.2 Update nixpacks.toml

```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

## 🚀 Step 5: Deploy and Test

### 5.1 Deploy Backend

1. Push your code to GitHub
2. Railway will automatically deploy
3. Check the deployment logs for any errors
4. Note the generated URL (e.g., `https://your-app.up.railway.app`)

### 5.2 Deploy Frontend

1. Update the `EXPO_PUBLIC_API_URL` with your backend URL
2. Deploy the frontend
3. Test the connection

### 5.3 Health Check

Visit your backend URL + `/health` to verify it's running:

```
https://your-backend.up.railway.app/health
```

## 🔍 Step 6: Monitoring and Debugging

### 6.1 Railway Dashboard

- Monitor logs in the Railway dashboard
- Check resource usage
- View deployment history

### 6.2 Common Issues

**Backend won't start:**
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check logs for missing dependencies

**Frontend can't connect:**
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running

**Database connection issues:**
- Verify `DATABASE_URL` format
- Check SSL settings
- Run migrations manually

## 🛡️ Step 7: Security Checklist

- [ ] JWT secret is secure and unique
- [ ] Admin credentials are strong
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Database SSL is enabled
- [ ] Environment variables are not exposed in logs

## 📱 Step 8: Mobile App Configuration

### 8.1 Update app.json

```json
{
  "expo": {
    "name": "Ladder",
    "slug": "ladder",
    "version": "1.0.0",
    "extra": {
      "apiUrl": "https://your-backend.up.railway.app/api"
    }
  }
}
```

### 8.2 Build for Production

```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

## 🔄 Step 9: Continuous Deployment

Railway automatically deploys when you push to your main branch. To set up different environments:

1. Create separate Railway projects for staging
2. Use different environment variables
3. Set up branch-based deployments

## 📞 Support

If you encounter issues:

1. Check Railway logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity

## 🎉 You're Done!

Your Ladder app should now be running on Railway with:
- ✅ Backend API deployed
- ✅ Frontend deployed
- ✅ Database configured
- ✅ Environment variables set
- ✅ Security measures in place

Visit your Railway dashboard to monitor your application and make any necessary adjustments.
