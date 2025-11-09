// Database Configuration
export const DB_NAME = process.env.DB_NAME || 'smart-kitchen';

// JWT Token Expiry Times
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "10d";

// JWT Secrets
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Server Configuration
export const PORT = process.env.PORT || 3000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// AI Model Services
export const SALES_PREDICTION_API_URL = process.env.SALES_PREDICTION_API_URL || "http://localhost:8001";
export const WASTE_PREDICTION_API_URL = process.env.WASTE_PREDICTION_API_URL || "http://localhost:8002";

// Environment
export const NODE_ENV = process.env.NODE_ENV || "development";