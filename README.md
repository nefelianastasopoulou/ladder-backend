# Ladder Backend

Backend API for the Ladder mobile app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start the server:
```bash
npm start
```

## API Endpoints

- Authentication: `/api/auth/*`
- Profile: `/api/profile`
- Communities: `/api/communities/*`
- Posts: `/api/posts`
- Search: `/api/search/*`
- Admin: `/api/admin/*`

## Database

Uses PostgreSQL database with automatic migrations. Make sure PostgreSQL is running and configured in your `.env` file.
