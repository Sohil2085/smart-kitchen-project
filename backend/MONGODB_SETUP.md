# MongoDB Atlas Setup Guide

This project has been configured to use MongoDB Atlas (cloud database) instead of local MongoDB.

## Setup Instructions

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the free tier)

### 2. Get Your Connection String
1. In your MongoDB Atlas dashboard, click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
   ```

### 3. Create Environment File
Create a `.env` file in the backend directory with the following content:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/smart-kitchen?retryWrites=true&w=majority

# Server Configuration
PORT=8000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary Configuration (if using image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Update Connection String
Replace the `<username>`, `<password>`, and `<cluster-name>` in the MONGODB_URI with your actual MongoDB Atlas credentials.

### 5. Database Access
Make sure to:
1. Add your IP address to the IP whitelist in MongoDB Atlas
2. Create a database user with read/write permissions
3. Update the connection string with the correct username and password

## Security Notes
- Never commit your `.env` file to version control
- Use strong passwords for your database user
- Regularly rotate your database credentials
- Consider using environment-specific connection strings for different deployment environments

## Troubleshooting
- If connection fails, check your IP whitelist in MongoDB Atlas
- Ensure your database user has the correct permissions
- Verify the connection string format is correct
- Check that your cluster is running and accessible
