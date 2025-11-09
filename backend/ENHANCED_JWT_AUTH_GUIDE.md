# Enhanced JWT Authentication System

## Overview
The Smart Kitchen project now features a comprehensive JWT-based authentication system with enhanced security features, role-based access control, and complete token management.

## 🚀 New Features Added

### 1. Refresh Token Endpoint
- **Endpoint**: `POST /api/v1/user/refresh-token`
- **Purpose**: Renew expired access tokens using refresh tokens
- **Security**: Validates refresh token against database
- **Response**: New access token and refresh token

### 2. Default Users Creation
- **Endpoint**: `POST /api/v1/user/create-default-users`
- **Purpose**: Create test users for development
- **Users Created**:
  - Admin: `admin@gmail.com` / `admin123`
  - Chef: `chef@gmail.com` / `chef123`

### 3. Enhanced Error Handling
- Detailed error messages for different JWT errors
- Specific handling for expired tokens
- Better user feedback

### 4. Environment Configuration
- Complete `.env.example` file with all required variables
- Secure JWT secrets included
- Development and production configurations

## 🔐 Authentication Flow

### 1. User Registration
```bash
POST /api/v1/user/register
Content-Type: application/json

{
  "fullname": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "employee"
}
```

### 2. User Login
```bash
POST /api/v1/user/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@gmail.com",
      "role": "admin",
      "fullname": "Admin User"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully"
}
```

### 3. Token Refresh
```bash
POST /api/v1/user/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

### 4. Protected Routes
All protected routes require the `Authorization` header:
```bash
Authorization: Bearer <access_token>
```

### 5. User Logout
```bash
POST /api/v1/user/logout
Authorization: Bearer <access_token>
```

## 🛡️ Security Features

### Token Security
- **Access Tokens**: 15-minute expiry
- **Refresh Tokens**: 10-day expiry
- **HTTP-Only Cookies**: Prevent XSS attacks
- **Database Storage**: Refresh tokens stored securely

### Role-Based Access Control
- **Admin**: Full system access
- **Chef**: Inventory management access
- **Employee**: Limited access

### Middleware Functions
- `verifyJWT`: Basic authentication
- `verifyAdminOrChef`: Admin or Chef access
- `verifyAdmin`: Admin-only access
- `verifyChef`: Chef or Admin access

## 🔧 Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# JWT Configuration
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Database
MONGODB_URI=mongodb://localhost:27017/smart-kitchen

# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### 2. Create Default Users
```bash
curl -X POST http://localhost:3000/api/v1/user/create-default-users
```

### 3. Test Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "admin123"}'

# Use access token for protected routes
curl -X GET http://localhost:3000/api/v1/inventory \
  -H "Authorization: Bearer <access_token>"
```

## 📚 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/user/register` | Register new user | No |
| POST | `/api/v1/user/login` | User login | No |
| POST | `/api/v1/user/logout` | User logout | Yes |
| POST | `/api/v1/user/refresh-token` | Refresh access token | No |
| POST | `/api/v1/user/create-default-users` | Create test users | No |

## 🔍 Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is required",
  "data": null
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin or Chef role required",
  "data": null
}
```

#### Token Expired
```json
{
  "success": false,
  "message": "Access token has expired",
  "data": null
}
```

## 🚀 Production Considerations

### Security Enhancements
1. **Use HTTPS**: Enable secure cookies in production
2. **Strong Secrets**: Generate new JWT secrets for production
3. **Token Rotation**: Implement refresh token rotation
4. **Rate Limiting**: Add rate limiting to auth endpoints
5. **Audit Logging**: Log authentication events

### Environment Variables for Production
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
# Use secure JWT secrets
ACCESS_TOKEN_SECRET=your-production-secret
REFRESH_TOKEN_SECRET=your-production-refresh-secret
```

## 🧪 Testing

### Test the Complete Flow
1. Create default users
2. Login with admin credentials
3. Use access token for protected routes
4. Test token refresh when access token expires
5. Test logout functionality

### Frontend Integration
The frontend already includes:
- Auth context for state management
- Login/logout components
- Token storage in localStorage
- Automatic token refresh handling

## 📝 Notes

- All JWT secrets are cryptographically secure (512-bit entropy)
- Refresh tokens are stored in the database for security
- HTTP-only cookies prevent XSS attacks
- Role-based access control is enforced at the middleware level
- Error handling provides clear feedback for debugging

This enhanced JWT authentication system provides a robust, secure foundation for the Smart Kitchen project with complete token management and role-based access control.
