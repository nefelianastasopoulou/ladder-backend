# Ladder Backend API Documentation

## Overview
The Ladder Backend API provides endpoints for user management, communities, posts, opportunities, messaging, and administrative functions.

**Base URL**: `http://localhost:3001` (development)  
**API Version**: 1.0.0

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "data": {...},
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "status": 400,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Rate Limiting
- **General API**: 100 requests per 15 minutes (production), 1000 requests per 15 minutes (development)
- **Authentication**: 5 attempts per 15 minutes
- **Signup**: 3 attempts per hour
- **File Uploads**: 10 uploads per 15 minutes

---

## Endpoints

### Health & Status

#### GET /
**Description**: API status check  
**Authentication**: None  
**Response**:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Ladder Backend API is running",
    "version": "1.0.0"
  }
}
```

#### GET /health
**Description**: Health check endpoint  
**Authentication**: None  
**Response**:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Health check passed"
  }
}
```

### Authentication

#### POST /api/auth/signup
**Description**: Register a new user  
**Authentication**: None  
**Rate Limit**: 3 attempts per hour  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "username": "johndoe"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "is_admin": false
    }
  },
  "message": "User created successfully"
}
```

#### POST /api/auth/signin
**Description**: Login user  
**Authentication**: None  
**Rate Limit**: 5 attempts per 15 minutes  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "is_admin": false
    }
  },
  "message": "Login successful"
}
```

#### POST /api/auth/make-admin
**Description**: Promote user to admin (admin only)  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "user_id": 123
}
```

### User Management

#### GET /api/users
**Description**: Get all users (admin only)  
**Authentication**: Required (Admin)  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_admin": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/profile
**Description**: Get current user profile  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "username": "johndoe",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/profile
**Description**: Update user profile  
**Authentication**: Required  
**Request Body**:
```json
{
  "full_name": "John Smith",
  "username": "johnsmith",
  "bio": "Software developer",
  "location": "New York",
  "field": "Technology",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Search

#### GET /api/search/users
**Description**: Search users  
**Authentication**: Required  
**Query Parameters**:
- `q` (string): Search query

#### GET /api/search/posts
**Description**: Search posts  
**Authentication**: Required  
**Query Parameters**:
- `q` (string): Search query

#### GET /api/search/communities
**Description**: Search communities  
**Authentication**: Required  
**Query Parameters**:
- `q` (string): Search query

#### GET /api/search/all
**Description**: Combined search across users, posts, and communities  
**Authentication**: Required  
**Query Parameters**:
- `q` (string): Search query

### Communities

#### GET /api/communities
**Description**: Get all public communities  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tech Enthusiasts",
      "description": "A community for tech lovers",
      "category": "Technology",
      "member_count": 150,
      "is_public": true,
      "creator_name": "John Doe",
      "is_member": true
    }
  ]
}
```

#### POST /api/communities
**Description**: Create a new community  
**Authentication**: Required  
**Request Body**:
```json
{
  "name": "Tech Enthusiasts",
  "description": "A community for tech lovers",
  "category": "Technology"
}
```

#### GET /api/communities/:id/posts
**Description**: Get posts for a specific community  
**Authentication**: Required  
**Path Parameters**:
- `id` (number): Community ID

#### POST /api/communities/:id/posts
**Description**: Create a post in a community  
**Authentication**: Required  
**Rate Limit**: 10 uploads per 15 minutes  
**Request Body** (multipart/form-data):
- `title` (string): Post title
- `content` (string): Post content
- `image` (file, optional): Image file (max 5MB)

#### POST /api/communities/:id/join
**Description**: Join a community  
**Authentication**: Required

#### POST /api/communities/:id/leave
**Description**: Leave a community  
**Authentication**: Required

#### PUT /api/communities/:id
**Description**: Update community settings (creator only)  
**Authentication**: Required  
**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "is_public": true
}
```

### Posts

#### POST /api/posts
**Description**: Create a platform-wide post  
**Authentication**: Required  
**Rate Limit**: 10 uploads per 15 minutes  
**Request Body** (multipart/form-data):
- `title` (string): Post title
- `content` (string): Post content
- `image` (file, optional): Image file (max 5MB)

### Opportunities

#### GET /api/opportunities
**Description**: Get all opportunities  
**Authentication**: None  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Software Developer Internship",
      "description": "Join our team as a software developer intern",
      "category": "Technology",
      "location": "Remote",
      "deadline": "2024-12-31T23:59:59.000Z",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/opportunities/my
**Description**: Get user's created opportunities  
**Authentication**: Required

### Applications

#### GET /api/applications
**Description**: Get user's applications  
**Authentication**: Required

### Favorites

#### GET /api/favorites
**Description**: Get user's favorite opportunities  
**Authentication**: Required

### Messaging

#### GET /api/conversations
**Description**: Get user's conversations  
**Authentication**: Required

#### POST /api/conversations/individual
**Description**: Create or get individual conversation  
**Authentication**: Required  
**Request Body**:
```json
{
  "other_user_id": 123
}
```

#### GET /api/conversations/:id/messages
**Description**: Get messages for a conversation  
**Authentication**: Required

#### POST /api/conversations/:id/messages
**Description**: Send a message  
**Authentication**: Required  
**Request Body**:
```json
{
  "content": "Hello!",
  "message_type": "text"
}
```

### Settings

#### GET /api/settings
**Description**: Get user settings  
**Authentication**: Required

#### PUT /api/settings
**Description**: Update user settings  
**Authentication**: Required  
**Request Body**:
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "language": "en",
  "show_activity_status": true
}
```

### Onboarding

#### POST /api/onboarding
**Description**: Complete user onboarding  
**Authentication**: Required  
**Request Body**:
```json
{
  "age_range": "18-25",
  "field_of_study": ["Computer Science", "Engineering"],
  "academic_level": "Undergraduate",
  "university": "University of Example",
  "preferences": ["Technology", "Startups"]
}
```

### Reports

#### POST /api/reports
**Description**: Report content or users  
**Authentication**: Required  
**Request Body**:
```json
{
  "reported_type": "user|community|post",
  "reported_id": 123,
  "reason": "Inappropriate content",
  "description": "Additional details"
}
```

### Admin Endpoints

#### GET /api/admin/users
**Description**: Get all users for admin management  
**Authentication**: Required (Admin)

#### GET /api/admin/communities
**Description**: Get all communities for admin management  
**Authentication**: Required (Admin)

#### GET /api/admin/posts
**Description**: Get all posts for admin management  
**Authentication**: Required (Admin)

#### GET /api/admin/reports
**Description**: Get all reports  
**Authentication**: Required (Admin)

#### PUT /api/admin/reports/:id
**Description**: Update report status  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "status": "pending|reviewed|resolved|dismissed"
}
```

#### DELETE /api/admin/users/:id
**Description**: Delete a user  
**Authentication**: Required (Admin)

#### DELETE /api/admin/communities/:id
**Description**: Delete a community  
**Authentication**: Required (Admin)

#### DELETE /api/admin/posts/:id
**Description**: Delete a post  
**Authentication**: Required (Admin)

### Admin Setup

#### POST /admin/setup
**Description**: Initial admin setup (temporary endpoint)  
**Authentication**: None  
**Rate Limit**: 1 attempt per hour  
**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Admin user created successfully",
    "credentials": {
      "email": "admin@example.com",
      "username": "admin",
      "password": "adminPassword"
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## File Upload

- **Maximum file size**: 5MB
- **Allowed formats**: JPEG, PNG, GIF, WebP
- **Upload endpoint**: Any endpoint accepting `image` field
- **File access**: `/uploads/{filename}`

## Security Features

- JWT token authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Security headers
- File upload validation
