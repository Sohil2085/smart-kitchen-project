# Authentication System Guide

## Overview
The smart kitchen project now has a proper JWT-based authentication system with role-based access control. Only users with **admin** or **chef** roles can manage inventory.

## Default Users
The system comes with two default users for testing:

### Admin User
- **Email**: `admin@gmail.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Access**: Full access to all inventory management features

### Chef User
- **Email**: `chef@gmail.com`
- **Password**: `chef123`
- **Role**: `chef`
- **Access**: Can manage inventory (add, update, delete items)

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/v1/user/register
```
**Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

#### 2. Login User
```
POST /api/v1/user/login
```
**Body:**
```json
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
  "message": "Login successful"
}
```

#### 3. Logout User
```
POST /api/v1/user/logout
```
**Headers:**
```
Authorization: Bearer <access_token>
```

#### 4. Create Default Users (for testing)
```
POST /api/v1/user/create-default-users
```

## Inventory Management Access

### Protected Routes
All inventory routes require authentication with admin or chef role:

```
GET    /api/v1/inventory/           - Get all inventory items
POST   /api/v1/inventory/           - Add new inventory item (chef/admin)
GET    /api/v1/inventory/:id        - Get inventory item by ID
PUT    /api/v1/inventory/:id        - Update inventory item (chef/admin)
DELETE /api/v1/inventory/:id        - Delete inventory item (chef/admin)
GET    /api/v1/inventory/stats      - Get inventory statistics
GET    /api/v1/inventory/low-stock  - Get low stock items
GET    /api/v1/inventory/expired    - Get expired items
```

### Required Headers
For all inventory requests, include the JWT token:
```
Authorization: Bearer <access_token>
```

## Frontend Integration

### 1. Login Flow
```javascript
// Login request
const loginResponse = await fetch('/api/v1/user/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@gmail.com',
    password: 'admin123'
  })
});

const loginData = await loginResponse.json();
const { accessToken, user } = loginData.data;

// Store token for future requests
localStorage.setItem('accessToken', accessToken);
```

### 2. Making Authenticated Requests
```javascript
// Get inventory items
const inventoryResponse = await fetch('/api/v1/inventory/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Role-based UI
```javascript
// Check user role for conditional rendering
if (user.role === 'admin' || user.role === 'chef') {
  // Show inventory management features
  showInventoryManagement();
} else {
  // Show access denied message
  showAccessDenied();
}
```

## Environment Variables
Make sure these are set in your `.env` file:
```
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

## Security Features
- JWT tokens with 15-minute expiry for access tokens
- Refresh tokens with 7-day expiry
- Password hashing with bcrypt
- Role-based access control
- Secure HTTP-only cookies for token storage
- CORS configuration for frontend integration

## Testing the System

1. **Start the backend server**
2. **Create default users**: `POST /api/v1/user/create-default-users`
3. **Login with admin**: Use `admin@gmail.com` / `admin123`
4. **Test inventory access**: Make requests with the returned JWT token
5. **Try with chef role**: Login with `chef@gmail.com` / `chef123`

## Error Handling
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: Valid token but insufficient role permissions
- **400 Bad Request**: Missing required fields or validation errors
