# Environment Setup Guide

This guide will help you configure your Smart Kitchen project to use environment variables instead of dummy data.

## Overview

The project has been updated to use environment variables for all configuration. You need to create `.env` files in the appropriate directories with your actual configuration values.

## Required Environment Files

### 1. Backend Environment File

Create a `.env` file in the `backend/` directory with the following content:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/smart-kitchen?retryWrites=true&w=majority

# Server Configuration
PORT=8000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
ACCESS_TOKEN_SECRET=04ee03f7944a4d72fa57d67ae33c5b9000b3679b3880806f39166428b21373fff62f5b277661a3e924c26b35436ef61cce731abbdff31e5f733c38cfdacc92e6
REFRESH_TOKEN_SECRET=ea1403e34942e3cda6e363878116eb23e4b0185bd807a0d0e56f6f87376b269871ec8b85cc65175901830188b3f1e3287fd459cc78d205a2e8ef2226cb9b9b11

# Cloudinary Configuration (for image uploads)
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

### 2. Frontend Environment File

Create a `.env` file in the `frontend/` directory with the following content:

```env
# Backend API Base URL
VITE_API_BASE=http://localhost:8000/api/v1

# AI Model Services URLs
VITE_SALES_PREDICTION_API_URL=http://localhost:8001
VITE_WASTE_PREDICTION_API_URL=http://localhost:8002

# Environment
VITE_NODE_ENV=development
```

### 3. Sales Prediction Service Environment File

Create a `.env` file in the `ai-model/sales_prediction/` directory with the following content:

```env
# Model and Data Paths
MODEL_PATH=models/sales_model.pkl
DATA_PATH=data/processed_sales.csv

# Server Configuration
PORT=8001
HOST=0.0.0.0

# Environment
NODE_ENV=development
```

### 4. Waste Prediction Service Environment File

Create a `.env` file in the `ai-model/waste_prediction/` directory with the following content:

```env
# Model and Data Paths
MODEL_PATH=../models/waste_model.pkl
DATA_PATH=../data/inventory.csv

# Server Configuration
PORT=8002
HOST=0.0.0.0

# Environment
NODE_ENV=development
```

## Configuration Steps

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster-name>` in the MONGODB_URI

### Step 2: Cloudinary Setup (Optional)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your cloud name, API key, and API secret
4. Update the Cloudinary configuration in your backend `.env` file

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# AI Model dependencies
cd ../ai-model/sales_prediction
pip install -r requirements.txt

cd ../waste_prediction
pip install -r requirements.txt
```

### Step 4: Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Sales Prediction Service
cd ai-model/sales_prediction
python app/main.py

# Terminal 4: Waste Prediction Service
cd ai-model/waste_prediction
python app/main.py
```

## What Changed

### Backend Changes
- Updated `constant.js` to use environment variables
- Modified `app.js` and `index.js` to use configuration constants
- Updated JWT authentication to use environment variables
- Modified Cloudinary configuration to use environment variables

### Frontend Changes
- Already configured to use `VITE_API_BASE` environment variable
- API calls will now use the configured backend URL

### AI Model Services Changes
- Added environment variable support for model paths and server configuration
- Updated requirements.txt to include python-dotenv
- Services now use configurable ports and paths

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT tokens
- Regularly rotate your database credentials
- Use environment-specific configurations for different deployment environments

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your MONGODB_URI format
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify your database user has proper permissions

2. **JWT Token Errors**
   - Ensure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are set
   - Check that the secrets are the same across all services

3. **CORS Errors**
   - Verify CORS_ORIGIN matches your frontend URL
   - Check that the frontend VITE_API_BASE matches your backend URL

4. **AI Model Services Not Starting**
   - Ensure model files exist in the specified paths
   - Check that all Python dependencies are installed
   - Verify the ports are not already in use

### Testing Configuration

You can test your configuration by:

1. Starting the backend service and checking for connection success messages
2. Accessing the frontend and verifying API calls work
3. Testing AI model endpoints directly with curl or Postman

## Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that all required files exist in the specified paths
