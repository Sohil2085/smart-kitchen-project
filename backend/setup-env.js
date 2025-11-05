#!/usr/bin/env node

/**
 * Environment Setup Script for Smart Kitchen Backend
 * This script helps set up the environment configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Default environment configuration
const defaultEnv = `# MongoDB Atlas Configuration
# For local development, you can use MongoDB locally or set up MongoDB Atlas
# Option 1: Local MongoDB (recommended for development)
MONGODB_URI=mongodb://localhost:27017/smart-kitchen

# Option 2: MongoDB Atlas (uncomment and replace with your actual credentials)
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/smart-kitchen?retryWrites=true&w=majority

# Server Configuration
PORT=8000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
ACCESS_TOKEN_SECRET=04ee03f7944a4d72fa57d67ae33c5b9000b3679b3880806f39166428b21373fff62f5b277661a3e924c26b35436ef61cce731abbdff31e5f733c38cfdacc92e6
REFRESH_TOKEN_SECRET=ea1403e34942e3cda6e363878116eb23e4b0185bd807a0d0e56f6f87376b269871ec8b85cc65175901830188b3f1e3287fd459cc78d205a2e8ef2226cb9b9b11

# Cloudinary Configuration (for image uploads)
# Get these from https://cloudinary.com/console
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
`;

function setupEnvironment() {
    console.log('🔧 Setting up Smart Kitchen Backend Environment...\n');

    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        console.log('⚠️  .env file already exists!');
        console.log('📝 Current .env file will be backed up to .env.backup');
        
        // Backup existing .env file
        const backupPath = path.join(__dirname, '.env.backup');
        fs.copyFileSync(envPath, backupPath);
        console.log('✅ Backup created: .env.backup\n');
    }

    // Create .env.example file
    fs.writeFileSync(envExamplePath, defaultEnv);
    console.log('✅ Created .env.example file');

    // Create .env file
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ Created .env file with default configuration');

    console.log('\n🎉 Environment setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Install MongoDB locally or set up MongoDB Atlas');
    console.log('2. Update .env file with your MongoDB connection string if needed');
    console.log('3. Run: npm run dev');
    console.log('\n📖 For detailed setup instructions, see SETUP_GUIDE.md');
}

function checkMongoDB() {
    console.log('\n🔍 Checking MongoDB connection...');
    
    // This is a simple check - in a real scenario, you'd test the actual connection
    console.log('💡 To test MongoDB connection:');
    console.log('   - Local MongoDB: mongod --version');
    console.log('   - Atlas: Check your connection string in .env');
}

// Run setup
setupEnvironment();
checkMongoDB();

