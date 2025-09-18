# Security Configuration Guide

This guide helps you set up secure environment variables for your Ladder app backend.

## 🔐 Required Environment Variables

### 1. JWT Secret (CRITICAL)

**Purpose**: Used to sign and verify JWT tokens for authentication.

**Requirements**:
- Must be at least 32 characters long
- Should be cryptographically secure
- Must be different for each environment (dev/staging/prod)

**Generate a secure JWT secret**:
```bash
node scripts/generate-jwt-secret.js
```

**Example**:
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 2. Database Configuration

**PostgreSQL Connection**:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
```

**Connection Pool Settings**:
```bash
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_MAX_USES=7500
```

### 3. Email Configuration (Optional)

**SMTP Settings**:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Admin Configuration

**Admin Account**:
```bash
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-admin-password-123
```

### 5. Security Settings

**Rate Limiting**:
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**CORS Configuration**:
```bash
# For production, specify allowed domains
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# For development, leave empty (localhost is auto-allowed)
ALLOWED_ORIGINS=
```

## 🚀 Setup Instructions

### For Local Development

1. **Generate JWT Secret**:
   ```bash
   node scripts/generate-jwt-secret.js
   ```

2. **Create backend/.env file**:
   ```bash
   # Copy the generated JWT secret
   JWT_SECRET=your-generated-secret-here
   
   # Database (use local PostgreSQL or Railway)
   DATABASE_URL=postgresql://localhost:5432/ladder_dev
   
   # Admin account
   ADMIN_EMAIL=admin@example.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   
   # Development settings
   NODE_ENV=development
   PORT=3001
   LOG_LEVEL=debug
   ```

3. **Test the configuration**:
   ```bash
   cd backend
   npm run validate-env
   ```

### For Railway Deployment

1. **Go to Railway Dashboard** → Your Project → Variables

2. **Add these environment variables**:
   ```bash
   # Generate a new JWT secret for production
   JWT_SECRET=your-production-secret-here
   
   # Railway will provide this automatically
   DATABASE_URL=postgresql://...
   
   # Admin account
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure-production-password
   
   # Production settings
   NODE_ENV=production
   PORT=3001
   LOG_LEVEL=info
   
   # Security
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # CORS (add your production domains)
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Deploy and verify**:
   - Check Railway logs for successful startup
   - Test API endpoints
   - Verify authentication works

## 🔒 Security Best Practices

### JWT Secret Security

1. **Never commit secrets to version control**
2. **Use different secrets for each environment**
3. **Generate cryptographically secure secrets**
4. **Rotate secrets periodically**
5. **Store secrets securely (environment variables, not code)**

### CORS Security

1. **Development**: Allow localhost and Expo URLs
2. **Production**: Only allow your actual domains
3. **Mobile Apps**: No origin restrictions needed (they don't send origin headers)

### Database Security

1. **Use connection pooling**
2. **Enable SSL in production**
3. **Use strong passwords**
4. **Limit database access by IP if possible**

### Rate Limiting

1. **Set appropriate limits for your use case**
2. **Monitor for abuse**
3. **Adjust limits based on traffic patterns**

## 🧪 Testing Security Configuration

### 1. Validate Environment Variables
```bash
cd backend
npm run validate-env
```

### 2. Test JWT Authentication
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Test CORS
```bash
# Test from different origin
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  http://localhost:3001/api/auth/signin
```

## 🚨 Troubleshooting

### Backend Won't Start

**Error**: `JWT_SECRET is not set`
**Solution**: Add JWT_SECRET to your environment variables

**Error**: `JWT_SECRET must be at least 32 characters long`
**Solution**: Generate a longer secret using the script

### CORS Issues

**Error**: `Not allowed by CORS`
**Solution**: 
- For development: Check if you're using localhost
- For production: Add your domain to ALLOWED_ORIGINS

### Database Connection Issues

**Error**: `Database connection failed`
**Solution**:
- Check DATABASE_URL format
- Verify database is running
- Check network connectivity

## 📞 Support

If you encounter issues:
1. Check the logs: `cd backend && npm run dev`
2. Validate environment: `npm run validate-env`
3. Test individual components
4. Check Railway logs for deployment issues
