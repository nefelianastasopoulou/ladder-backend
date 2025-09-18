# 🚀 Railway Deployment & Expo Go Testing Checklist

## ✅ **Pre-Deployment Checklist**

### **1. Backend Configuration (Railway)**

#### **Environment Variables to Set in Railway Dashboard:**
```bash
# Node.js Configuration
NIXPACKS_NODE_VERSION=20
NODE_ENV=production
PORT=3001

# Database Configuration (Railway will provide this automatically)
# DATABASE_URL=postgresql://... (set by Railway)

# Security Configuration
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters-long
BCRYPT_ROUNDS=12

# Email Configuration
EMAIL_USER=your-production-email@domain.com
EMAIL_PASS=your-production-app-password

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-very-secure-admin-password

# Application Configuration
LOG_LEVEL=info
TRUST_PROXY=true

# Database Performance
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_MAX_USES=7500
SLOW_QUERY_THRESHOLD=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration (for Expo Go)
ALLOWED_ORIGINS=
```

#### **Railway Service Configuration:**
- ✅ `railway.json` is properly configured
- ✅ `nixpacks.toml` specifies Node.js 20
- ✅ Health check endpoint: `/health`
- ✅ Start command: `cd backend && npm start`

### **2. Frontend Configuration (Expo Go)**

#### **Environment Variables for Expo:**
```bash
# Set these in your .env file or environment
EXPO_PUBLIC_API_URL=https://your-railway-app.railway.app/api
EXPO_PUBLIC_APP_NAME=Ladder
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

#### **Expo Go Compatibility:**
- ✅ `app.json` is properly configured
- ✅ Bundle identifier: `com.nefeli.ladder`
- ✅ Scheme: `ladder`
- ✅ All required plugins are included
- ✅ CORS is configured for mobile apps

### **3. Database Setup**

#### **Railway PostgreSQL:**
- ✅ Database service is provisioned
- ✅ Migrations will run automatically on deployment
- ✅ Connection pooling is configured
- ✅ SSL is enabled by default

### **4. Security Configuration**

#### **CORS for Expo Go:**
- ✅ Backend allows requests with no origin (for mobile apps)
- ✅ Development origins are whitelisted
- ✅ Production origins can be configured via `ALLOWED_ORIGINS`

#### **JWT Security:**
- ✅ Strong JWT secret (32+ characters)
- ✅ Proper expiration time (7 days)
- ✅ Secure admin credentials

## 🚀 **Deployment Steps**

### **Step 1: Deploy Backend to Railway**

1. **Connect Repository:**
   ```bash
   # In Railway dashboard, connect your GitHub repository
   # Select the backend folder as the root directory
   ```

2. **Set Environment Variables:**
   - Go to Railway project → Variables tab
   - Add all environment variables listed above
   - **Important:** Set `DATABASE_URL` to your Railway PostgreSQL URL

3. **Deploy:**
   ```bash
   # Railway will automatically:
   # 1. Install dependencies
   # 2. Run migrations
   # 3. Start the server
   ```

4. **Verify Deployment:**
   ```bash
   # Check health endpoint
   curl https://your-app.railway.app/health
   
   # Should return:
   # {
   #   "status": "healthy",
   #   "timestamp": "2024-01-01T00:00:00.000Z",
   #   "uptime": 123.456,
   #   "database": "connected",
   #   "memory": "normal"
   # }
   ```

### **Step 2: Configure Frontend for Expo Go**

1. **Update API URL:**
   ```bash
   # In your .env file or environment
   EXPO_PUBLIC_API_URL=https://your-railway-app.railway.app/api
   ```

2. **Start Expo Development Server:**
   ```bash
   npm start
   # or
   npm run start:dev
   ```

3. **Test with Expo Go:**
   - Scan QR code with Expo Go app
   - Test login/signup functionality
   - Test API connectivity

## 🧪 **Testing Checklist**

### **Backend API Tests:**
- [ ] Health check endpoint responds
- [ ] Database connection is working
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are generated correctly
- [ ] File uploads work (if applicable)
- [ ] CORS allows Expo Go requests

### **Frontend Tests:**
- [ ] App loads in Expo Go
- [ ] Login screen displays correctly
- [ ] API calls work (no network errors)
- [ ] Navigation works
- [ ] Error handling works
- [ ] Offline handling works

### **Integration Tests:**
- [ ] User can register and login
- [ ] Data persists between app restarts
- [ ] Push notifications work (if enabled)
- [ ] File uploads work
- [ ] Real-time features work (if any)

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**
   ```bash
   # Solution: Ensure ALLOWED_ORIGINS is empty for mobile apps
   ALLOWED_ORIGINS=
   ```

2. **Database Connection Issues:**
   ```bash
   # Check DATABASE_URL format
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

3. **JWT Secret Issues:**
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Expo Go Network Issues:**
   ```bash
   # Ensure API URL is accessible
   # Check if Railway app is running
   # Verify CORS configuration
   ```

### **Debug Commands:**
```bash
# Check backend logs
railway logs

# Test API endpoint
curl https://your-app.railway.app/api/health

# Validate environment
cd backend && npm run validate-env

# Check frontend configuration
npm run type-check
```

## 📱 **Expo Go Specific Notes**

### **Network Configuration:**
- Expo Go can access your Railway backend directly
- No need for ngrok or tunneling
- CORS is configured to allow mobile app requests

### **Development vs Production:**
- Use `npm run start:dev` for development
- Use `npm run start:prod` for production testing
- Environment variables are automatically loaded

### **Testing on Different Devices:**
- Test on both iOS and Android
- Test on different network conditions
- Test with and without internet connection

## 🎯 **Success Criteria**

Your deployment is successful when:
- ✅ Backend health check returns 200 OK
- ✅ Database migrations run successfully
- ✅ Expo Go can connect to your API
- ✅ Users can register and login
- ✅ All core features work as expected
- ✅ No CORS or network errors
- ✅ Performance is acceptable

## 📞 **Support**

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Expo logs in the terminal
3. Verify environment variables
4. Test API endpoints manually
5. Check CORS configuration

---

**Ready to deploy?** Follow this checklist step by step, and your app should work perfectly with Railway and Expo Go! 🚀
