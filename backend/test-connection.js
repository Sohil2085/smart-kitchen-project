#!/usr/bin/env node

/**
 * Test script to verify backend connection setup
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const testConnection = async () => {
    console.log('🧪 Testing Smart Kitchen Backend Connection...\n');

    // Test 1: Environment Variables
    console.log('1️⃣ Checking Environment Variables:');
    const requiredVars = ['MONGODB_URI', 'PORT', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
    let envOk = true;

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value && !value.includes('<') && !value.includes('your_')) {
            console.log(`   ✅ ${varName}: SET`);
        } else {
            console.log(`   ❌ ${varName}: NOT SET or has placeholder value`);
            envOk = false;
        }
    });

    if (!envOk) {
        console.log('\n⚠️  Some environment variables need to be configured!');
        console.log('📝 Please update your .env file with proper values.');
        return;
    }

    // Test 2: MongoDB Connection
    console.log('\n2️⃣ Testing MongoDB Connection:');
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log(`   🔗 Connecting to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
        
        await mongoose.connect(mongoUri);
        console.log('   ✅ MongoDB connection successful!');
        console.log(`   📊 Database: ${mongoose.connection.name}`);
        console.log(`   🌐 Host: ${mongoose.connection.host}`);
        
        // Test basic operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   📁 Collections: ${collections.length} found`);
        
        await mongoose.disconnect();
        console.log('   🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.log('   ❌ MongoDB connection failed!');
        console.log(`   📝 Error: ${error.message}`);
        
        if (error.message.includes('EBADNAME')) {
            console.log('\n💡 Solution: Update MONGODB_URI in .env file');
            console.log('   - For local MongoDB: mongodb://localhost:27017/smart-kitchen');
            console.log('   - For Atlas: mongodb+srv://username:password@cluster.mongodb.net/smart-kitchen');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Solution: Start MongoDB service');
            console.log('   - Windows: net start MongoDB');
            console.log('   - macOS: brew services start mongodb-community');
            console.log('   - Linux: sudo systemctl start mongod');
        }
    }

    // Test 3: Port Availability
    console.log('\n3️⃣ Checking Port Availability:');
    const port = process.env.PORT || 8000;
    console.log(`   🚪 Backend will run on port: ${port}`);
    console.log(`   🌐 Frontend expects backend on: ${port}`);
    console.log(`   🔗 CORS configured for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);

    // Test 4: JWT Configuration
    console.log('\n4️⃣ JWT Configuration:');
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    
    if (accessSecret && refreshSecret) {
        console.log('   ✅ JWT secrets configured');
        console.log(`   ⏰ Access token expiry: ${process.env.ACCESS_TOKEN_EXPIRY || '15m'}`);
        console.log(`   ⏰ Refresh token expiry: ${process.env.REFRESH_TOKEN_EXPIRY || '10d'}`);
    } else {
        console.log('   ❌ JWT secrets not configured');
    }

    console.log('\n🎯 Summary:');
    console.log('   📋 Environment: ' + (envOk ? '✅ Configured' : '❌ Needs setup'));
    console.log('   🗄️  MongoDB: ' + (mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not connected'));
    console.log('   🔐 JWT: ' + (accessSecret && refreshSecret ? '✅ Ready' : '❌ Not configured'));

    if (envOk && mongoose.connection.readyState === 1) {
        console.log('\n🎉 Backend is ready to start!');
        console.log('   Run: npm run dev');
    } else {
        console.log('\n⚠️  Please fix the issues above before starting the backend.');
        console.log('   📖 See SETUP_GUIDE.md for detailed instructions');
    }
};

// Run the test
testConnection().catch(console.error);

