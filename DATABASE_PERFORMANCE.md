# Database Performance Optimization Guide

## Overview
This document outlines the database performance optimizations implemented in the Ladder Backend to ensure optimal performance under load.

## Performance Improvements Implemented

### 1. Enhanced Connection Pooling
- **Maximum Connections**: 20 (configurable via `DB_POOL_MAX`)
- **Minimum Connections**: 2 (configurable via `DB_POOL_MIN`)
- **Idle Timeout**: 30 seconds (configurable via `DB_IDLE_TIMEOUT`)
- **Connection Timeout**: 2 seconds (configurable via `DB_CONNECTION_TIMEOUT`)
- **Max Uses per Connection**: 7,500 (configurable via `DB_MAX_USES`)

### 2. Query Performance Monitoring
- **Slow Query Detection**: Automatically logs queries taking longer than 1 second
- **Performance Statistics**: Tracks total queries, slow queries, and average execution time
- **Real-time Monitoring**: Database performance metrics available via `/health/database` endpoint

### 3. Database Indexes
Comprehensive indexing strategy for optimal query performance:

#### User-related Indexes
- `idx_users_email` - Fast email lookups
- `idx_users_username` - Fast username lookups
- `idx_users_created_at` - Efficient user sorting

#### Post-related Indexes
- `idx_posts_author_id` - Fast author-based queries
- `idx_posts_community_id` - Fast community post queries
- `idx_posts_created_at` - Efficient post sorting
- `idx_posts_is_published` - Published post filtering

#### Community-related Indexes
- `idx_communities_created_by` - Creator-based queries
- `idx_communities_is_public` - Public community filtering
- `idx_community_members_user_id` - User membership queries
- `idx_community_members_community_id` - Community member queries

#### Message-related Indexes
- `idx_messages_conversation_id` - Fast conversation message queries
- `idx_messages_sender_id` - Sender-based queries
- `idx_messages_created_at` - Message sorting
- `idx_messages_is_read` - Unread message filtering

#### Composite Indexes
- `idx_posts_community_published_created` - Optimized community post queries
- `idx_messages_conversation_read_created` - Optimized message queries
- `idx_community_members_user_role` - Role-based membership queries

### 4. Query Optimizations

#### Conversation Query Optimization
**Before**: Complex nested subqueries with multiple JOINs
```sql
SELECT DISTINCT c.*, 
       u.full_name as other_user_name,
       -- ... complex nested queries
FROM conversations c
JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
-- ... multiple JOINs and subqueries
```

**After**: Optimized with Common Table Expressions (CTEs)
```sql
WITH conversation_data AS (
  SELECT DISTINCT c.*, 
         u.full_name as other_user_name,
         -- ... optimized data selection
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  -- ... streamlined JOINs
),
latest_messages AS (
  SELECT 
    conversation_id,
    content as last_message,
    -- ... optimized message selection with ROW_NUMBER()
  FROM messages
  WHERE conversation_id IN (SELECT id FROM conversation_data)
)
-- ... efficient final query
```

#### Response Mapping Optimization
**Before**: Nested database queries in response mapping
```javascript
other_user: {
  id: row.other_user_username ? 
    db.query('SELECT id FROM users WHERE username = $1', [row.other_user_username], ...) : null,
  // ... nested query
}
```

**After**: Pre-fetched data in main query
```javascript
other_user: {
  name: row.other_user_name,
  username: row.other_user_username,
  avatar: row.other_user_avatar
  // ... no nested queries
}
```

## Configuration

### Environment Variables
```bash
# Database Performance Configuration
DB_POOL_MAX=20                    # Maximum connections in pool
DB_POOL_MIN=2                     # Minimum connections in pool
DB_IDLE_TIMEOUT=30000             # Idle connection timeout (ms)
DB_CONNECTION_TIMEOUT=2000        # Connection timeout (ms)
DB_MAX_USES=7500                  # Max uses per connection
SLOW_QUERY_THRESHOLD=1000         # Slow query threshold (ms)
```

### Production Recommendations
```bash
# High-traffic production settings
DB_POOL_MAX=50
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=5000
SLOW_QUERY_THRESHOLD=500
```

## Monitoring

### Database Performance Endpoints
- **GET** `/health/database` - Database performance metrics (admin only)
- **POST** `/health/database/reset` - Reset performance statistics (admin only)

### Performance Metrics
```json
{
  "status": "OK",
  "database": {
    "performance": {
      "totalQueries": 1250,
      "slowQueries": 12,
      "slowQueryPercentage": "0.96%",
      "averageQueryTime": "45ms",
      "totalQueryTime": "56250ms"
    },
    "connectionPool": {
      "totalConnections": 8,
      "idleConnections": 3,
      "waitingClients": 0,
      "utilizationPercentage": "62%"
    }
  }
}
```

## Performance Testing

### Quick Performance Test
```bash
node tests/db-performance-test.js
```

### Full API Test Suite
```bash
npm run test-suite
```

## Best Practices

### 1. Query Optimization
- Use prepared statements for repeated queries
- Avoid N+1 query problems
- Use appropriate indexes
- Limit result sets with pagination

### 2. Connection Management
- Use connection pooling
- Close connections properly
- Monitor connection usage
- Set appropriate timeouts

### 3. Monitoring
- Track slow queries
- Monitor connection pool usage
- Set up alerts for performance degradation
- Regular performance reviews

### 4. Index Maintenance
- Monitor index usage
- Remove unused indexes
- Update statistics regularly
- Consider partial indexes for large tables

## Troubleshooting

### Common Issues

#### High Connection Usage
- Check for connection leaks
- Increase pool size if needed
- Review connection timeout settings

#### Slow Queries
- Check slow query logs
- Analyze query execution plans
- Add missing indexes
- Optimize query structure

#### Memory Usage
- Monitor connection pool memory
- Review query result sizes
- Implement pagination
- Use streaming for large results

## Migration History
- **Migration 005**: Added performance indexes
- **Database Layer**: Enhanced with monitoring and pooling
- **Query Optimization**: Implemented CTEs and removed nested queries

## Future Improvements
- Query result caching
- Read replicas for scaling
- Database partitioning
- Advanced monitoring dashboards
