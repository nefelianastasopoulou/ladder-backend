# 🚀 Ladder App Setup Guide

This guide will help you set up the Ladder app for development and production deployment.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Git
- Railway account (for production deployment)

## 🛠️ Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd my-first-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Generate JWT Secret
```bash
# Generate a secure JWT secret
npm run generate-jwt-secret
# Copy the generated secret for your .env file
```

#### Create Environment Files
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the .env file with your actual values
# Required variables:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (use the generated secret)
# - EMAIL_USER (your email service username)
# - EMAIL_PASS (your email service password)
# - ADMIN_EMAIL (admin user email)
# - ADMIN_USERNAME (admin username)
# - ADMIN_PASSWORD (strong admin password)
```

#### Example .env Configuration
```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/ladder_dev

# JWT (use generated secret)
JWT_SECRET=your_generated_jwt_secret_here

# Email Configuration
EMAIL_USER=your-email@example.com
EMAIL_PASS=your_app_specific_password

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_admin_password

# CORS (for development)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### 3. Database Setup

#### Local PostgreSQL Setup
```bash
# Create database
createdb ladder_dev

# Run migrations
cd backend
npm run migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Servers

#### Backend Server
```bash
cd backend
npm run dev
# Server will start on http://localhost:3001
```

#### Frontend (Expo)
```bash
# In a new terminal
npm start
# Follow the Expo CLI instructions
```

## 🚀 Production Deployment (Railway)

### 1. Railway Setup

1. Connect your GitHub repository to Railway
2. Create a new PostgreSQL database service
3. Set up environment variables in Railway dashboard

### 2. Required Environment Variables

Set these in your Railway project:

```bash
# Database (automatically provided by Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# JWT (generate a new secret for production)
JWT_SECRET=your_production_jwt_secret

# Email Configuration
EMAIL_USER=your-production-email@example.com
EMAIL_PASS=your_production_email_password

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_production_admin_password

# CORS (your production domains)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Security
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
```

### 3. Deploy

Railway will automatically deploy when you push to your main branch. The deployment process:

1. Installs dependencies
2. Validates environment variables
3. Runs database migrations
4. Starts the server

## 🔧 Troubleshooting

### Common Issues

#### 1. Environment Validation Failed
```bash
# Check environment variables
cd backend
npm run validate-env
```

#### 2. Database Connection Issues
- Verify DATABASE_URL is correct
- Check if PostgreSQL is running
- Ensure database exists

#### 3. JWT Secret Issues
```bash
# Generate a new JWT secret
npm run generate-jwt-secret
```

#### 4. CORS Issues
- Check ALLOWED_ORIGINS configuration
- Ensure frontend URL is included

### Development Commands

```bash
# Backend commands
cd backend
npm run dev              # Start development server
npm run validate-env     # Validate environment
npm run migrate          # Run database migrations
npm run db:seed          # Seed database
npm run db:backup        # Backup database
npm run lint             # Run linter
npm run test             # Run tests

# Frontend commands
npm start                # Start Expo development server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web
npm run build            # Build for production
```

## 📁 Project Structure

```
my-first-app/
├── app/                 # Expo/React Native frontend
├── backend/             # Node.js/Express backend
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── migrations/     # Database migrations
├── config/             # Shared configuration
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords
- Generate secure JWT secrets
- Use app-specific passwords for email services
- Regularly rotate secrets and passwords
- Monitor logs for security issues

## 📞 Support

If you encounter issues:

1. Check the logs: `cd backend && npm run dev`
2. Validate environment: `npm run validate-env`
3. Check database connection
4. Review the troubleshooting section above

## 🎉 You're Ready!

Your Ladder app should now be running successfully. The backend API will be available at `http://localhost:3001` and the frontend will be accessible through the Expo development server.
