#!/usr/bin/env node

/**
 * Smart Kitchen Project Startup Script
 * This script helps start both backend and frontend with proper configuration
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

console.log('🚀 Starting Smart Kitchen Project...\n');

// Function to run a command
function runCommand(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Starting ${name}...`);
        
        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} started successfully`);
                resolve();
            } else {
                console.log(`❌ ${name} failed with code ${code}`);
                reject(new Error(`${name} failed`));
            }
        });

        process.on('error', (error) => {
            console.log(`❌ Error starting ${name}:`, error.message);
            reject(error);
        });
    });
}

// Check if MongoDB is available
async function checkMongoDB() {
    console.log('🔍 Checking MongoDB availability...');
    
    try {
        const { spawn } = await import('child_process');
        
        return new Promise((resolve) => {
            const mongod = spawn('mongod', ['--version'], { shell: true });
            
            mongod.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ MongoDB is available');
                    resolve(true);
                } else {
                    console.log('❌ MongoDB not found');
                    console.log('💡 Please install MongoDB or use MongoDB Atlas');
                    console.log('📖 See backend/MONGODB_SETUP_INSTRUCTIONS.md for details');
                    resolve(false);
                }
            });
            
            mongod.on('error', () => {
                console.log('❌ MongoDB not found');
                console.log('💡 Please install MongoDB or use MongoDB Atlas');
                console.log('📖 See backend/MONGODB_SETUP_INSTRUCTIONS.md for details');
                resolve(false);
            });
        });
    } catch (error) {
        console.log('❌ MongoDB not found');
        console.log('💡 Please install MongoDB or use MongoDB Atlas');
        console.log('📖 See backend/MONGODB_SETUP_INSTRUCTIONS.md for details');
        return false;
    }
}

// Main startup function
async function startProject() {
    try {
        // Check MongoDB
        const mongoAvailable = await checkMongoDB();
        
        if (!mongoAvailable) {
            console.log('\n⚠️  MongoDB is required to run the backend.');
            console.log('📋 Options:');
            console.log('   1. Install MongoDB locally (see backend/MONGODB_SETUP_INSTRUCTIONS.md)');
            console.log('   2. Use MongoDB Atlas (cloud)');
            console.log('   3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
            console.log('\n🔄 After setting up MongoDB, run this script again.');
            return;
        }

        console.log('\n🎯 Starting backend and frontend...\n');

        // Start backend
        const backendProcess = spawn('npm', ['run', 'dev'], {
            cwd: backendPath,
            stdio: 'inherit',
            shell: true
        });

        // Wait a bit for backend to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start frontend
        const frontendProcess = spawn('npm', ['run', 'dev'], {
            cwd: frontendPath,
            stdio: 'inherit',
            shell: true
        });

        console.log('\n🎉 Smart Kitchen Project Started!');
        console.log('📊 Backend: http://localhost:8000');
        console.log('🌐 Frontend: http://localhost:5173');
        console.log('\n📝 Default login credentials:');
        console.log('   Admin: admin@gmail.com / admin123');
        console.log('   Chef: chef@gmail.com / chef123');
        console.log('\n🛑 Press Ctrl+C to stop both services');

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping services...');
            backendProcess.kill();
            frontendProcess.kill();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error starting project:', error.message);
        process.exit(1);
    }
}

// Run the startup
startProject();

