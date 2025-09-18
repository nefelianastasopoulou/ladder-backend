# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp ../.env.example .env
   
   # Edit .env with your configuration
   # At minimum, you need:
   # - DATABASE_URL
   # - JWT_SECRET (at least 32 characters)
   # - EMAIL_USER and EMAIL_PASS
   # - ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   npm run migrate
   
   # Seed the database (optional)
   npm run db:seed
   ```

4. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `EMAIL_USER` - Email address for sending emails
- `EMAIL_PASS` - Email password or app password
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

### Optional Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)
- `DB_POOL_MAX` - Max database connections (default: 20)
- `DB_POOL_MIN` - Min database connections (default: 2)

## Database

The backend uses PostgreSQL. For development, you can use:
- Local PostgreSQL installation
- Railway PostgreSQL (recommended)
- Docker PostgreSQL

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:backup` - Backup database
- `npm run validate-env` - Validate environment variables

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your DATABASE_URL
   - Ensure PostgreSQL is running
   - Verify SSL settings for Railway

2. **JWT Secret Too Short**
   - JWT_SECRET must be at least 32 characters
   - Generate a secure random string

3. **Email Configuration**
   - Use app passwords for Gmail
   - Check email credentials

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on port 3001
