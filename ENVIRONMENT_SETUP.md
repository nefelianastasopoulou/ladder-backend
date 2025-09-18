# Environment Configuration Guide

This guide explains how to set up and manage environment variables for the Ladder app.

## 🚀 Quick Start

1. **Setup your environment:**
   ```bash
   npm run setup:dev        # For development
   npm run setup:staging    # For staging
   npm run setup:prod       # For production
   npm run setup:test       # For testing
   ```

2. **Validate your configuration:**
   ```bash
   npm run validate-env
   ```

3. **Start your application:**
   ```bash
   npm run dev              # Development
   npm start                # Production
   ```

## 📁 Environment Files

### Single .env File Approach
We use a single `.env` file that contains all environment variables. This approach:
- ✅ Eliminates confusion about which file is being used
- ✅ Provides consistent configuration across environments
- ✅ Makes it easier to manage and validate settings
- ✅ Reduces the chance of configuration errors

### File Structure
```
├── .env                    # Main environment file (created by setup script)
├── .env.example           # Template with all possible variables
├── backend/.env           # Backend-specific environment file
├── backend/.env.example   # Backend template
└── config/
    ├── environments.js    # Environment-specific defaults
    ├── env-validator.js   # Validation logic
    └── environment.js     # Main configuration loader
```

## 🔧 Environment Setup Commands

### Development Environment
```bash
npm run setup:dev
```
Creates a `.env` file optimized for development with:
- Debug mode enabled
- Local database connection
- Permissive rate limiting
- Localhost CORS origins

### Staging Environment
```bash
npm run setup:staging
```
Creates a `.env` file for staging with:
- Production-like settings
- Staging database connection
- Moderate rate limiting
- Staging CORS origins

### Production Environment
```bash
npm run setup:prod
```
Creates a `.env` file for production with:
- Optimized performance settings
- Production database connection
- Strict rate limiting
- Production CORS origins

### Test Environment
```bash
npm run setup:test
```
Creates a `.env` file for testing with:
- Test database connection
- Very permissive settings
- Minimal logging

## ✅ Validation

### Automatic Validation
The environment is automatically validated when:
- The application starts
- You run `npm run validate-env`
- You run database migrations

### Manual Validation
```bash
npm run validate-env
```

This will check:
- ✅ All required variables are set
- ✅ JWT secret is strong enough
- ✅ Email addresses are valid
- ✅ Numeric values are valid
- ✅ Boolean values are valid
- ✅ Database URL format is correct

## 📋 Required Variables

These variables **must** be set in your `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key-here` |
| `EMAIL_USER` | Email address for sending emails | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password or app password | `your-app-password` |
| `ADMIN_EMAIL` | Admin user email address | `admin@ladder.com` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password (min 8 chars) | `secure-password` |

## 🔧 Optional Variables

These variables have sensible defaults but can be customized:

### Application Settings
- `NODE_ENV` - Environment (development/staging/production/test)
- `PORT` - Server port (default: 3001)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)

### Database Settings
- `DB_POOL_MAX` - Maximum database connections
- `DB_POOL_MIN` - Minimum database connections
- `DB_IDLE_TIMEOUT` - Idle connection timeout
- `DB_CONNECTION_TIMEOUT` - Connection timeout
- `DB_MAX_USES` - Maximum uses per connection
- `SLOW_QUERY_THRESHOLD` - Slow query threshold (ms)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (ms)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

### CORS
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Security
- `TRUST_PROXY` - Trust proxy headers (true/false)

### File Storage
- `STORAGE_TYPE` - Storage type (local/s3/cloudinary)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## 🧹 Cleanup

### Remove Old Environment Files
If you have old environment files from the previous setup, you can clean them up:

```bash
npm run cleanup:env
```

This will:
- Remove old `.env.development`, `.env.production`, etc. files
- Create backups before deletion
- Keep the main `.env` and `.env.example` files

### Dry Run
To see what would be removed without actually removing files:

```bash
node scripts/cleanup-env-files.js --dry-run
```

## 🔒 Security Best Practices

### JWT Secret
- Must be at least 32 characters long
- Should contain a mix of letters, numbers, and symbols
- Should be unique for each environment
- Never commit to version control

### Database URL
- Use strong passwords
- Enable SSL in production
- Use connection pooling
- Monitor connection usage

### Admin Credentials
- Use strong passwords (min 8 characters)
- Use unique usernames
- Consider using environment-specific admin accounts

## 🚨 Troubleshooting

### Common Issues

#### "Missing required environment variables"
- Run `npm run setup:dev` to create a new `.env` file
- Check that all required variables are set
- Run `npm run validate-env` to see detailed errors

#### "JWT_SECRET validation failed"
- Your JWT secret must be at least 32 characters long
- Use a strong, random secret
- Generate a new secret: `openssl rand -base64 32`

#### "Database connection failed"
- Check your `DATABASE_URL` format
- Ensure the database server is running
- Verify credentials and permissions

#### "Email configuration invalid"
- Check `EMAIL_USER` is a valid email address
- Verify `EMAIL_PASS` is correct
- For Gmail, use an app password instead of your regular password

### Getting Help

1. **Check validation errors:**
   ```bash
   npm run validate-env
   ```

2. **View current configuration:**
   ```bash
   npm run validate-env
   ```

3. **Regenerate environment file:**
   ```bash
   npm run setup:dev
   ```

## 📚 Additional Resources

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Email Configuration Guide](https://nodemailer.com/about/)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## 🔄 Migration from Old System

If you're migrating from the old multiple `.env` files system:

1. **Backup your current configuration:**
   ```bash
   cp .env .env.backup
   ```

2. **Clean up old files:**
   ```bash
   npm run cleanup:env
   ```

3. **Setup new environment:**
   ```bash
   npm run setup:dev
   ```

4. **Copy your values:**
   - Open the new `.env` file
   - Copy your actual values from the backup
   - Replace the placeholder values

5. **Validate:**
   ```bash
   npm run validate-env
   ```

6. **Test:**
   ```bash
   npm run dev
   ```
