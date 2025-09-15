# Database Setup Guide

This guide explains how to set up and manage the database for the Ladder application.

## Prerequisites

- PostgreSQL database (local or remote)
- Node.js environment with required dependencies

## Environment Variables

Make sure your `.env` file contains the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ladder_db

# Optional Database Performance Settings
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_MAX_USES=7500
SLOW_QUERY_THRESHOLD=1000

# SSL Configuration (for production)
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

## Database Schema

The application uses the following key tables:

- **users**: User accounts (email can be duplicate, username must be unique)
- **posts**: User posts and content
- **communities**: User-created communities
- **community_members**: Community membership relationships
- **conversations**: Chat conversations
- **messages**: Chat messages
- **opportunities**: Job/internship opportunities
- **applications**: User applications to opportunities
- **favorites**: User-favorited opportunities
- **reports**: Content moderation reports

## Migration System

### Running Migrations

1. **Run all pending migrations:**
   ```bash
   npm run migrate
   ```

2. **Run a specific migration:**
   ```bash
   npm run run-migration 006_fix_email_constraint_and_add_indexes.sql
   ```

3. **Validate environment variables:**
   ```bash
   npm run validate-env
   ```

### Migration Files

- `001_initial_schema.sql` - Initial database schema
- `002_create_admin_user.sql` - Creates initial admin user
- `003_add_onboarding_fields.sql` - Adds user onboarding fields
- `004_remove_email_unique_constraint.sql` - Removes email uniqueness
- `005_add_performance_indexes.sql` - Adds performance indexes
- `006_fix_email_constraint_and_add_indexes.sql` - Fixes email constraint and adds indexes

## Database Configuration

The application uses environment-specific database configurations:

- **Development**: `database.dev.js` - Optimized for local development
- **Production**: `database.prod.js` - Optimized for production with SSL

## Performance Optimization

### Indexes

The database includes comprehensive indexes for optimal performance:

- User lookups (username, email)
- Post queries (author, community, creation date)
- Community operations (creator, public status)
- Message queries (conversation, sender, date)
- Application and favorite queries

### Connection Pooling

- **Development**: 1-10 connections
- **Production**: 2-20 connections
- Automatic connection management
- Performance monitoring and slow query detection

## Troubleshooting

### Common Issues

1. **Connection refused:**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **SSL errors:**
   - For local development, set `DATABASE_SSL=false`
   - For production, ensure SSL certificates are properly configured

3. **Migration failures:**
   - Check database permissions
   - Verify migration file syntax
   - Check for conflicting constraints

### Performance Issues

1. **Slow queries:**
   - Check slow query logs
   - Verify indexes are being used
   - Consider query optimization

2. **Connection pool exhaustion:**
   - Increase pool size
   - Check for connection leaks
   - Monitor connection usage

## Backup and Recovery

### Creating Backups

```bash
npm run backup
```

### Restoring from Backup

1. Stop the application
2. Restore the database from backup
3. Run migrations if needed
4. Restart the application

## Security Considerations

- Use strong passwords for database users
- Enable SSL in production
- Regularly update PostgreSQL
- Monitor database access logs
- Use connection pooling to prevent connection exhaustion

## Monitoring

The application includes built-in database monitoring:

- Query performance tracking
- Slow query detection
- Connection pool statistics
- Error logging and reporting

Access monitoring endpoints:
- `/health/database` - Database health check
- `/health/detailed` - Detailed system information
