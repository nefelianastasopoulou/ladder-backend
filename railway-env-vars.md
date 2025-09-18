# Railway Environment Variables Configuration

## Required Environment Variables for Railway Deployment

Add these environment variables in your Railway dashboard:

### Node.js Configuration
```
NIXPACKS_NODE_VERSION=20
```

### Database Configuration
```
DATABASE_URL=your_postgresql_connection_string_from_railway
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_MAX_USES=7500
SLOW_QUERY_THRESHOLD=1000
```

### Security Configuration
```
JWT_SECRET=your_very_secure_jwt_secret_at_least_32_characters_long
BCRYPT_ROUNDS=12
```

**Generate a secure JWT secret**:
```bash
npm run generate:jwt-secret
```

### Email Configuration (if using email features)
```
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

### Admin Configuration
```
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password
```

### Application Configuration
```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS Configuration
```
ALLOWED_ORIGINS=
```

## How to Add Environment Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to the "Variables" tab
4. Add each environment variable listed above
5. Click "Deploy" to apply changes

## Verification:

After deployment, check the logs to ensure:
- Node.js version is 20.x
- Database connection is successful
- All environment variables are loaded
- Server starts on the correct port
