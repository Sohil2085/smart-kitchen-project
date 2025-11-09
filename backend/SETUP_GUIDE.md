# Smart Kitchen Backend Setup Guide

## 🚨 Connection Issues Fixed

### 1. **MongoDB Connection Issue** ✅ FIXED
The main issue was that the `.env` file contained placeholder values for MongoDB Atlas connection.

**Solutions:**

#### Option A: Use Local MongoDB (Recommended for Development)
1. Install MongoDB locally:
   - **Windows**: Download from https://www.mongodb.com/try/download/community
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow MongoDB installation guide

2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS/Linux**: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. Update your `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/smart-kitchen
   ```

#### Option B: Use MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create a free account and cluster
3. Get your connection string
4. Update your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/smart-kitchen?retryWrites=true&w=majority
   ```

### 2. **Port Configuration** ✅ FIXED
- Backend now runs on port 8000 (as configured in `.env`)
- Frontend API calls updated to use port 8000
- CORS configured for frontend on port 5173

### 3. **Environment Variables Setup**

Create or update your `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/smart-kitchen

# Server Configuration
PORT=8000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration (already set)
ACCESS_TOKEN_SECRET=04ee03f7944a4d72fa57d67ae33c5b9000b3679b3880806f39166428b21373fff62f5b277661a3e924c26b35436ef61cce731abbdff31e5f733c38cfdacc92e6
REFRESH_TOKEN_SECRET=ea1403e34942e3cda6e363878116eb23e4b0185bd807a0d0e56f6f87376b269871ec8b85cc65175901830188b3f1e3287fd459cc78d205a2e8ef2226cb9b9b11

# Cloudinary Configuration (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Database Name
DB_NAME=smart-kitchen

# AI Model Services Configuration
SALES_PREDICTION_API_URL=http://localhost:8001
WASTE_PREDICTION_API_URL=http://localhost:8002

# Environment
NODE_ENV=development
```

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB:**
   - Install MongoDB locally OR
   - Set up MongoDB Atlas and update `.env` with your connection string

3. **Start the Backend:**
   ```bash
   npm run dev
   ```

4. **Start the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally: `mongod --version`
- Check if port 27017 is available
- For Atlas: Verify your IP is whitelisted and credentials are correct

### Port Issues
- Backend runs on port 8000
- Frontend runs on port 5173
- Ensure no other services are using these ports

### CORS Issues
- Backend CORS is configured for `http://localhost:5173`
- If using different frontend port, update `CORS_ORIGIN` in `.env`

## 📝 Default Users

After starting the backend, you can create default users by calling:
```bash
curl -X POST http://localhost:8000/api/v1/user/create-default-users
```

This creates:
- Admin: `admin@gmail.com` / `admin123`
- Chef: `chef@gmail.com` / `chef123`

## 🔐 Authentication

The system uses JWT tokens with:
- Access tokens (15 minutes expiry)
- Refresh tokens (10 days expiry)
- Automatic token refresh in frontend

## 📊 Database Models

The system includes models for:
- Users (authentication)
- Inventory items
- Menu items
- Orders
- Sales data
- Waste analysis

## 🎯 API Endpoints

- `/api/v1/user/*` - Authentication
- `/api/v1/inventory/*` - Inventory management
- `/api/v1/menu/*` - Menu management
- `/api/v1/orders/*` - Order management
- `/api/v1/sales/*` - Sales analytics
- `/api/v1/dashboard/*` - Dashboard data

