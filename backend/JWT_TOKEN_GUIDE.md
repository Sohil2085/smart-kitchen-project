# JWT Token Configuration Guide

## Overview
This guide explains the JWT (JSON Web Token) authentication system implemented in the Smart Kitchen project, including how to generate and configure secure access and refresh tokens.

## Token Types

### 1. Access Token
- **Purpose**: Short-lived token for API authentication
- **Expiry**: 15 minutes (configurable in `constant.js`)
- **Usage**: Required for all protected API endpoints
- **Storage**: Sent as HTTP-only cookie and in response body

### 2. Refresh Token
- **Purpose**: Long-lived token for obtaining new access tokens
- **Expiry**: 10 days (configurable in `constant.js`)
- **Usage**: Used to refresh expired access tokens
- **Storage**: Stored in database and sent as HTTP-only cookie

## Generated Keys

The following cryptographically secure keys have been generated for your project:

### Access Token Secret
```
04ee03f7944a4d72fa57d67ae33c5b9000b3679b3880806f39166428b21373fff62f5b277661a3e924c26b35436ef61cce731abbdff31e5f733c38cfdacc92e6
```

### Refresh Token Secret
```
ea1403e34942e3cda6e363878116eb23e4b0185bd807a0d0e56f6f87376b269871ec8b85cc65175901830188b3f1e3287fd459cc78d205a2e8ef2226cb9b9b11
```

## Configuration Files

### .env File
The `.env` file contains all environment variables including the JWT secrets:
```env
ACCESS_TOKEN_SECRET=04ee03f7944a4d72fa57d67ae33c5b9000b3679b3880806f39166428b21373fff62f5b277661a3e924c26b35436ef61cce731abbdff31e5f733c38cfdacc92e6
REFRESH_TOKEN_SECRET=ea1403e34942e3cda6e363878116eb23e4b0185bd807a0d0e56f6f87376b269871ec8b85cc65175901830188b3f1e3287fd459cc78d205a2e8ef2226cb9b9b11
```

### .env.example File
A template file for other developers to create their own `.env` file.

## Security Features

### 1. Cryptographically Secure Keys
- Generated using Node.js `crypto.randomBytes(64)` for 512-bit entropy
- Each key is 128 characters long (64 bytes in hex)
- Keys are unique and unpredictable

### 2. Environment Variable Protection
- `.env` file is in `.gitignore` to prevent accidental commits
- Keys are loaded from environment variables, not hardcoded
- Fallback values are provided for development

### 3. Token Security
- Access tokens have short expiry (15 minutes)
- Refresh tokens are stored in database and can be revoked
- HTTP-only cookies prevent XSS attacks
- Secure flag can be enabled for HTTPS

## Usage in Code

### Token Generation
```javascript
// In user.model.js
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    )
}
```

### Token Verification
```javascript
// In auth.middleware.js
const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
```

## API Endpoints

### Authentication Flow
1. **Login**: `POST /api/v1/user/login`
   - Returns access token and refresh token
   - Sets HTTP-only cookies

2. **Protected Routes**: All inventory routes require valid access token
   - Header: `Authorization: Bearer <access_token>`

3. **Logout**: `POST /api/v1/user/logout`
   - Clears refresh token from database
   - Clears cookies

## Role-Based Access Control

### User Roles
- **admin**: Full access to all features
- **chef**: Can manage inventory
- **employee**: Limited access

### Middleware Functions
- `verifyJWT`: Validates access token
- `verifyAdminOrChef`: Requires admin or chef role
- `verifyAdmin`: Requires admin role only
- `verifyChef`: Requires chef or admin role

## Development vs Production

### Development
- Uses generated keys from `.env` file
- HTTP-only cookies with `secure: false`
- Fallback secrets in middleware

### Production
- Use different, more secure keys
- Set `secure: true` for HTTPS
- Consider shorter token expiry times
- Implement token rotation

## Key Generation Commands

To generate new secure keys:

```bash
# Generate new access token secret
node -e "console.log('ACCESS_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate new refresh token secret
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** in production
4. **Monitor token usage** for security breaches
5. **Implement rate limiting** on authentication endpoints
6. **Use HTTPS** in production for secure cookie transmission

## Troubleshooting

### Common Issues
1. **"Invalid Access Token"**: Check if token is expired or malformed
2. **"Unauthorized request"**: Ensure Authorization header is present
3. **"Access denied"**: Verify user has required role permissions

### Debug Steps
1. Check if `.env` file exists and contains correct keys
2. Verify token format: `Bearer <token>`
3. Check token expiry times
4. Validate user role in database

## Security Considerations

- Keys are 512-bit entropy (extremely secure)
- Tokens are signed, not encrypted (use HTTPS for transport)
- Refresh tokens can be revoked by clearing from database
- Consider implementing token blacklisting for enhanced security
- Monitor for suspicious authentication patterns
