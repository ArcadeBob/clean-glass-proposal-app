# Authentication System Setup

## Overview

The authentication system is built with NextAuth.js v5 and includes both email/password and Google OAuth authentication.

## Features

- ✅ Email/password authentication
- ✅ Google OAuth authentication
- ✅ User registration with password hashing
- ✅ Protected routes with middleware
- ✅ Session management with JWT
- ✅ Profile management
- ✅ Role-based access control

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Database
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"

# NextAuth.js
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Google OAuth Setup

To enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Add these authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your environment variables

## Test Credentials

The system includes a test user:

- **Email:** test@example.com
- **Password:** password123
- **Role:** USER

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

## Protected Routes

The following routes require authentication:

- `/dashboard/*`
- `/profile/*`
- `/proposals/*`
- `/admin/*`

## Components

- `SessionProvider` - Wraps the app for session management
- `SignOutButton` - Component for signing out
- Authentication pages in `/auth/` directory

## Security Features

- Password hashing with bcrypt
- JWT session tokens
- CSRF protection
- Secure cookie handling
- Role-based access control
