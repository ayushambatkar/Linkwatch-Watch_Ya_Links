# Google Sign-In with JWT Authentication Implementation Guide

## Overview
This implementation provides complete Google OAuth 2.0 authentication with JWT tokens for your NestJS application.

## Files Created/Modified

### New Files Created:

1. **JWT Strategy** (`src/auth/strategies/jwt.strategy.ts`)
   - Validates JWT tokens from Authorization headers
   - Extracts userId and email from JWT payload

2. **JWT Guard** (`src/auth/guards/jwt.guard.ts`)
   - Protects routes that require authentication
   - Can be used with `@UseGuards(JwtGuard)` decorator

3. **Login DTOs** (`src/auth/dto/login.dto.ts`)
   - `LoginDto`: Basic login request
   - `AuthResponseDto`: Response with tokens and user info
   - `RefreshTokenDto`: Refresh token request
   - `GoogleSignInDto`: Google sign-in request

4. **Prisma Library** (`libs/prisma/`)
   - `prisma.service.ts`: Database connection service
   - `prisma.module.ts`: Exportable module
   - `index.ts`: Public API

### Files Modified:

1. **Google Strategy** (`src/auth/strategies/google.strategy.ts`)
   - Updated to use Passport Google OAuth 2.0
   - Extracts user profile and tokens from Google

2. **Auth Repository** (`src/auth/auth.repository.ts`)
   - `findOrCreateUser()`: Find or create user in database
   - `findUserById()`: Get user by ID
   - `findUserByEmail()`: Get user by email
   - `createAccount()`: Create OAuth account connection
   - `findAccountByProviderAndId()`: Find OAuth account
   - `updateAccountTokens()`: Update provider tokens

3. **Auth Service** (`src/auth/auth.service.ts`)
   - `googleSignIn()`: Handle Google OAuth callback
   - `signTokens()`: Generate access and refresh tokens
   - `refreshAccessToken()`: Generate new access token from refresh token
   - `generateAuthResponse()`: Prepare auth response with tokens

4. **Auth Controller** (`src/auth/auth.controller.ts`)
   - `GET /auth/google`: Initiates Google OAuth flow
   - `GET /auth/google/callback`: Google OAuth callback endpoint
   - `POST /auth/refresh`: Refresh access token
   - `GET /auth/me`: Get current user (protected)

5. **Auth Module** (`src/auth/auth.module.ts`)
   - Imported JwtModule, PassportModule, and PrismaModule
   - Registered JWT and Passport strategies

6. **Main tsconfig.json**
   - Added path aliases for @libs/prisma

## Environment Variables

Create a `.env` file with the following variables (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/linkwatch

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Server
PORT=3000
```

## API Endpoints

### 1. Initiate Google Sign-In
```
GET /auth/google
```
Redirects to Google's OAuth consent screen.

### 2. Google OAuth Callback
```
GET /auth/google/callback
```
Called by Google after user consent. Returns:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cuj7x...",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://..."
  }
}
```

### 3. Refresh Access Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Returns:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Get Current User (Protected)
```
GET /auth/me
Authorization: Bearer <accessToken>
```

Returns:
```json
{
  "userId": "cuj7x...",
  "email": "user@example.com"
}
```

## Usage Examples

### Protecting Routes with JWT

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from './auth/guards/jwt.guard';

@Controller('links')
export class LinksController {
  @Get()
  @UseGuards(JwtGuard)
  getAllLinks(@Req() req: any) {
    const userId = req.user.userId;
    // Get links for this user
  }
}
```

### Custom Request with Tracked User

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from './auth/guards/jwt.guard';

@Controller('profile')
export class ProfileController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(JwtGuard)
  getProfile(@Req() req: any) {
    const { userId, email } = req.user;
    // Use userId and email to fetch user profile
  }
}
```

## Database Schema

The implementation uses the existing Prisma schema:
- **User**: Stores user info (email, name, image)
- **Account**: Stores OAuth connections (Google, GitHub, etc.)

## Security Notes

1. **JWT Secret**: Change the `JWT_SECRET` to a strong random string in production
2. **Refresh Token Storage**: Currently uses in-memory Map. For production, use:
   - Redis
   - Database with TTL
   - Dedicated refresh token table
3. **HTTPS**: Always use HTTPS in production for OAuth and JWT
4. **CORS**: Configure CORS for your frontend domain
5. **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens in 7 days

## Next Steps

1. Set up Google OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Configure environment variables in `.env`
3. Run migrations: `pnpm prisma migrate dev`
4. Test the flow:
   - Visit `http://localhost:3000/auth/google`
   - Complete Google sign-in
   - Save the returned tokens
   - Use `accessToken` with `Authorization: Bearer <token>` header

## GitHub Strategy

The GitHub strategy file still exists. To use it, implement it similarly to Google:
- Add `GithubStrategy` to the auth module
- Add a `/auth/github` and `/auth/github/callback` endpoint
- Handle the callback to create/update users

## Troubleshooting

### "Cannot find module '@libs/prisma'"
Ensure the Prisma module is properly created and the tsconfig.json paths are updated.

### "JWT verification failed"
- Check that the same JWT_SECRET is used across your app
- Verify the token hasn't expired
- Ensure the Authorization header format is `Bearer <token>`

### "Google OAuth redirect_uri_mismatch"
Ensure the `GOOGLE_CALLBACK_URL` environment variable matches exactly what's configured in Google Cloud Console.
