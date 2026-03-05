# Ladder Backend

Backend API server for the Ladder mobile app. Built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with secure password hashing
- 👤 **User Management**: User profiles, settings, and preferences
- 🏘️ **Communities**: Create, manage, and join communities
- 📝 **Posts**: Create, edit, delete, and interact with posts
- 💼 **Opportunities**: Post and manage job opportunities, internships, and events
- 📬 **Applications**: Track applications to opportunities
- ⭐ **Favorites**: Save and manage favorite opportunities
- 🔍 **Search**: Full-text search across users, communities, posts, and opportunities
- 👥 **Social Features**: Follow users, connections, and followers
- 💬 **Messaging**: Direct conversations and messaging between users
- 🔔 **Notifications**: Real-time notification system
- 🛡️ **Admin Panel**: Administrative tools and content moderation
- 📊 **Reports**: Content reporting and moderation system
- 📤 **File Uploads**: Image and file upload support (AWS S3/Cloudinary)
- 📧 **Email Service**: Email notifications and password reset

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database (local or remote)
- npm or yarn
- AWS S3 account (optional, for file storage)
- Cloudinary account (optional, for image storage)
- Email service credentials (for email notifications)

## Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/ladder_db
   DB_POOL_MAX=20
   DB_POOL_MIN=2
   
   # JWT
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   
   # CORS
   CORS_ORIGIN=http://localhost:8081
   
   # Email (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # File Storage (optional)
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   
   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Set up the database**:
   
   Make sure PostgreSQL is running and create a database:
   ```sql
   CREATE DATABASE ladder_db;
   ```

5. **Run database migrations**:
   ```bash
   npm run migrate
   ```

6. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start development server with nodemon |
| `npm run migrate` | Run database migrations |
| `npm run db:seed` | Seed the database with test data |
| `npm run db:backup` | Backup the database |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run validate-env` | Validate environment variables |

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health information
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email address

### Profile (`/api/profile`)
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/profile/:userId` - Get user profile by ID
- `POST /api/profile/upload-avatar` - Upload profile picture

### Communities (`/api/communities`)
- `GET /api/communities` - List all communities
- `POST /api/communities` - Create new community
- `GET /api/communities/:id` - Get community details
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community
- `POST /api/communities/:id/join` - Join community
- `POST /api/communities/:id/leave` - Leave community
- `GET /api/communities/:id/members` - Get community members

### Posts (`/api/posts`)
- `GET /api/posts` - List posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Opportunities (`/api/opportunities`)
- `GET /api/opportunities` - List opportunities
- `POST /api/opportunities` - Create opportunity
- `GET /api/opportunities/:id` - Get opportunity details
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity

### Applications (`/api/applications`)
- `GET /api/applications` - Get user's applications
- `POST /api/applications` - Submit application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application status

### Favorites (`/api/favorites`)
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:id` - Remove from favorites

### Search (`/api/search`)
- `GET /api/search?q=query&type=users|communities|posts|opportunities` - Search

### Conversations (`/api/conversations`)
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation
- `GET /api/conversations/:id/messages` - Get messages

### Followers (`/api/followers`)
- `GET /api/followers` - Get followers
- `GET /api/followers/following` - Get following list
- `POST /api/followers/:userId/follow` - Follow user
- `DELETE /api/followers/:userId/unfollow` - Unfollow user

### Settings (`/api/settings`)
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

### Upload (`/api/upload`)
- `POST /api/upload` - Upload file/image

### Reports (`/api/reports`)
- `POST /api/reports` - Submit content report

### Admin (`/api/admin`)
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Get platform statistics
- `PUT /api/admin/users/:id/ban` - Ban user
- `PUT /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/reports` - Get all reports

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── environment.js   # Environment configuration
│   └── env-validator.js # Environment validation
├── middleware/          # Express middleware
│   ├── auth.js         # Authentication middleware
│   ├── validation.js   # Request validation
│   └── errorHandler.js # Error handling
├── routes/              # API route handlers
│   ├── auth.js         # Authentication routes
│   ├── profile.js      # User profile routes
│   ├── communities.js  # Community routes
│   ├── posts.js        # Post routes
│   └── ...
├── services/            # Business logic services
│   ├── userService.js   # User-related services
│   ├── emailService.js  # Email services
│   └── cloudStorage.js  # File storage services
├── utils/               # Utility functions
│   ├── logger.js        # Logging utility
│   └── ...
├── migrations/          # Database migrations
├── scripts/             # Utility scripts
├── database.js          # Database connection
└── server.js            # Main server file
```

## Database

The application uses PostgreSQL with automatic migrations. Key tables include:

- `users` - User accounts
- `posts` - User posts
- `communities` - Communities
- `community_members` - Community memberships
- `opportunities` - Job/internship opportunities
- `applications` - Opportunity applications
- `favorites` - User favorites
- `conversations` - Chat conversations
- `messages` - Chat messages
- `followers` - User follow relationships
- `reports` - Content moderation reports

See `DATABASE_SETUP.md` for detailed database setup instructions.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in requests:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are issued on login and can be refreshed using the refresh endpoint.

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Rate limiting (configurable)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection

## Deployment

### Railway Deployment

The backend is configured for Railway deployment. See deployment guides in the parent directory:
- `RAILWAY_DEPLOYMENT_GUIDE.md`
- `RAILWAY_SETUP_GUIDE.md`

### Environment Variables for Production

Ensure all required environment variables are set:
- Database connection string
- JWT secret
- CORS origins
- Email service credentials
- File storage credentials (if used)

## Testing

Run tests with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Monitoring

The server includes:
- Health check endpoints for monitoring
- Memory monitoring
- Database connection monitoring
- Request logging

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env`
   - Ensure database exists

2. **Migration errors**:
   - Check database permissions
   - Verify migration files are correct
   - Run migrations manually if needed

3. **Port already in use**:
   - Change `PORT` in `.env`
   - Or kill the process using the port

4. **JWT errors**:
   - Ensure `JWT_SECRET` is set
   - Check token expiration

## License

Private project - All rights reserved

## Support

For issues or questions, please contact the development team.
