# 🚀 Production Deployment Guide

## Option 1: Railway (Recommended)

### Step 1: Prepare Your Code
1. **Update your credentials** in `backend/.env.production`
2. **Commit your changes** to Git
3. **Push to GitHub**

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect your Node.js app

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL` environment variable

### Step 4: Set Environment Variables
In Railway dashboard, go to your service → Variables tab and add:
```
NODE_ENV=production
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here
EMAIL_USER=your-production-email@domain.com
EMAIL_PASS=your-production-app-password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-very-secure-admin-password
LOG_LEVEL=info
```

### Step 5: Deploy
1. Railway will automatically deploy when you push to your main branch
2. Your app will be available at `https://your-app-name.railway.app`

---

## Option 2: Heroku

### Step 1: Install Heroku CLI
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login and Create App
```bash
heroku login
heroku create your-app-name
```

### Step 3: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 4: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here
heroku config:set EMAIL_USER=your-production-email@domain.com
heroku config:set EMAIL_PASS=your-production-app-password
heroku config:set ADMIN_EMAIL=admin@yourdomain.com
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-very-secure-admin-password
```

### Step 5: Deploy
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

---

## Option 3: Render

### Step 1: Connect GitHub
1. Go to [render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Click "New" → "Web Service"

### Step 2: Configure Service
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `Node`

### Step 3: Add PostgreSQL Database
1. Click "New" → "PostgreSQL"
2. Render will automatically set the `DATABASE_URL`

### Step 4: Set Environment Variables
Add all the same variables as Railway/Heroku

---

## Mobile App Configuration

### For Production Build

#### Required Environment Variables
- `EXPO_PUBLIC_API_URL`: Your Railway backend URL (e.g., `https://your-app-name.railway.app/api`)

#### Optional Environment Variables
- `EXPO_PUBLIC_APP_NAME`: App name (default: "Ladder")
- `EXPO_PUBLIC_APP_VERSION`: App version (default: "1.0.0")
- `EXPO_PUBLIC_DEBUG_MODE`: Enable debug mode (default: "false")
- `EXPO_PUBLIC_ENABLE_ANALYTICS`: Enable analytics (default: "true")
- `EXPO_PUBLIC_ENABLE_CRASH_REPORTING`: Enable crash reporting (default: "true")
- `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS`: Enable push notifications (default: "true")
- `EXPO_PUBLIC_SENTRY_DSN`: Sentry DSN for error tracking
- `EXPO_PUBLIC_ANALYTICS_ID`: Analytics tracking ID

#### Setup Steps
1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables** in `.env`

3. **Build with EAS**:
   ```bash
   eas build --platform all --env production
   ```

4. **Or build locally**:
   ```bash
   expo build:android --env production
   expo build:ios --env production
   ```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT secret (32+ characters)
- [ ] Use production email credentials
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS (automatic on Railway/Heroku/Render)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database

---

## Cost Estimates

### Railway
- **Free tier**: $0/month (limited usage)
- **Pro**: $5/month per service + database costs

### Heroku
- **Free tier**: Discontinued
- **Basic**: $7/month per dyno + database costs

### Render
- **Free tier**: $0/month (limited usage)
- **Starter**: $7/month per service + database costs

---

## Monitoring & Maintenance

1. **Set up uptime monitoring** (UptimeRobot, Pingdom)
2. **Configure error tracking** (Sentry, Bugsnag)
3. **Set up log aggregation** (LogRocket, Papertrail)
4. **Monitor database performance**
5. **Set up automated backups**

---

## Next Steps After Deployment

1. **Test all endpoints** on production
2. **Verify database migrations** ran successfully
3. **Test user registration/login**
4. **Check file uploads** work
5. **Verify email functionality**
6. **Test mobile app** with production API
7. **Set up domain name** (optional)
8. **Configure SSL certificate** (automatic on most platforms)
