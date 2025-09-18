# Railway Deployment Guide for Ladder App

This guide will help you deploy your Ladder app backend to Railway and test it with Expo Go.

## 🚀 Quick Start

### 1. Deploy Backend to Railway

1. **Connect your GitHub repository to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Railway deployment:**
   - Railway will automatically detect this is a Node.js project
   - The `nixpacks.toml` file is already configured for Railway
   - The `railway.json` file contains deployment settings

3. **Set Environment Variables in Railway:**
   Go to your Railway project → Variables tab and add:

   ```bash
   # Required Variables
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<Railway will provide this automatically>
   JWT_SECRET=<Generate a secure secret key>
   
   # Optional Variables (recommended for production)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-admin-password
   
   # Database Settings (Railway optimized)
   DB_POOL_MIN=2
   DB_POOL_MAX=15
   DB_IDLE_TIMEOUT=20000
   DB_CONNECTION_TIMEOUT=5000
   DB_MAX_USES=5000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Security
   TRUST_PROXY=true
   LOG_LEVEL=warn
   ```

4. **Generate JWT Secret:**
   ```bash
   # Run this locally to generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Deploy:**
   - Railway will automatically deploy when you push to your main branch
   - Or click "Deploy" in the Railway dashboard

### 2. Test Backend Deployment

1. **Check deployment status:**
   - Go to your Railway project dashboard
   - Wait for deployment to complete (green status)

2. **Test health endpoint:**
   ```bash
   curl https://your-app-name.up.railway.app/api/health
   ```

3. **Test detailed health check:**
   ```bash
   curl https://your-app-name.up.railway.app/api/health/detailed
   ```

### 3. Configure Expo Go for Testing

1. **Update Expo Go configuration:**
   - Edit `.env.expo-go` file
   - Replace `https://your-railway-app-name.up.railway.app/api` with your actual Railway URL

2. **Start Expo Go:**
   ```bash
   npm run start:expo-go
   ```

3. **Test the app:**
   - Scan the QR code with Expo Go app
   - Test login/signup functionality
   - Test API connectivity

## 🔧 Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check Railway logs for errors
   - Verify all required environment variables are set
   - Ensure `DATABASE_URL` is provided by Railway

2. **Database connection issues:**
   - Railway automatically provides `DATABASE_URL`
   - Check if PostgreSQL addon is properly connected
   - Verify SSL settings in database configuration

3. **Expo Go can't connect:**
   - Ensure Railway URL is correct in `.env.expo-go`
   - Check if backend is running (test health endpoint)
   - Verify CORS settings allow Expo Go requests

4. **API endpoints return 404:**
   - All routes are now implemented
   - Check if backend is properly deployed
   - Verify route paths match frontend expectations

### Health Check Endpoints

- **Basic:** `GET /api/health`
- **Detailed:** `GET /api/health/detailed`
- **Readiness:** `GET /api/health/ready`
- **Liveness:** `GET /api/health/live`

### Database Migration

The backend will automatically run migrations on startup. If you need to run them manually:

```bash
# In Railway console or locally
cd backend && npm run migrate
```

## 📱 Testing with Expo Go

### Prerequisites
- Expo Go app installed on your phone
- Backend deployed and running on Railway
- Updated `.env.expo-go` with correct Railway URL

### Testing Steps

1. **Start the development server:**
   ```bash
   npm run start:expo-go
   ```

2. **Scan QR code with Expo Go**

3. **Test core functionality:**
   - User registration
   - User login
   - Profile management
   - Opportunities browsing
   - Favorites
   - Applications
   - Search functionality
   - Communities
   - Chat/messaging

### Expected API Endpoints

All these endpoints are now implemented:

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/opportunities` - Get all opportunities
- `POST /api/opportunities` - Create opportunity
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `GET /api/applications` - Get user applications
- `POST /api/applications` - Apply for opportunity
- `GET /api/search/all` - Search everything
- `GET /api/conversations` - Get conversations
- `POST /api/conversations/individual` - Create conversation
- `GET /api/communities` - Get communities
- `POST /api/communities` - Create community

## 🚨 Important Notes

1. **Environment Variables:** Make sure all required environment variables are set in Railway
2. **Database:** Railway will automatically provide a PostgreSQL database
3. **SSL:** Railway handles SSL certificates automatically
4. **CORS:** Configured to work with Expo Go and web clients
5. **Rate Limiting:** Configured for production use
6. **Health Checks:** Railway will use the health check endpoints for monitoring

## 🔄 Updates and Maintenance

1. **Deploy updates:**
   - Push changes to your main branch
   - Railway will automatically redeploy

2. **Monitor logs:**
   - Use Railway dashboard to view logs
   - Set up alerts for errors

3. **Database backups:**
   - Railway handles automatic backups
   - Manual backups available in Railway dashboard

## 📞 Support

If you encounter issues:

1. Check Railway deployment logs
2. Test backend endpoints directly
3. Verify environment variables
4. Check Expo Go console for errors
5. Review this guide for common solutions

## 🎉 Success!

Once everything is working:

1. Your backend is deployed on Railway
2. Expo Go can connect to your backend
3. All API endpoints are functional
4. Database is properly configured
5. You can test the full app functionality

Happy coding! 🚀
