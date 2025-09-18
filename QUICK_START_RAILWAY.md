# 🚀 Quick Start Guide for Railway Deployment

This is a simplified guide to get your Ladder app running on Railway quickly.

## ⚡ Quick Setup (5 minutes)

### 1. Deploy Backend
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `backend` folder
4. Add these environment variables in Railway:

```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-here
DATABASE_URL=postgresql://postgres:password@host:port/railway
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
TRUST_PROXY=true
```

### 2. Add Database
1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL`

### 3. Deploy Frontend
1. Create another Railway project
2. Select your repository (root directory)
3. Add this environment variable:

```bash
EXPO_PUBLIC_API_URL=https://your-backend-url.up.railway.app/api
```

### 4. Generate JWT Secret
Run this locally to get a secure secret:
```bash
cd backend
npm run generate-jwt-secret
```

Copy the output and add it as `JWT_SECRET` in Railway.

## ✅ Test Your Deployment

1. Visit your backend URL: `https://your-backend.up.railway.app`
2. Check health: `https://your-backend.up.railway.app/api/health`
3. Your frontend should now connect to the backend

## 🔧 Common Issues

**Backend won't start?**
- Check all environment variables are set
- Verify `DATABASE_URL` is correct
- Check Railway logs

**Frontend can't connect?**
- Update `EXPO_PUBLIC_API_URL` with your backend URL
- Check CORS settings

**Database issues?**
- Run migrations: `railway run --service backend npm run migrate`

## 📱 Next Steps

1. Test your app thoroughly
2. Set up custom domains
3. Configure monitoring
4. Set up CI/CD

That's it! Your app should be running on Railway. 🎉
