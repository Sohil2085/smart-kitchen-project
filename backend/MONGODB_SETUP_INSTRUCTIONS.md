# MongoDB Setup Instructions

## 🚨 Current Issue
MongoDB is not installed on your system, which is causing the connection error.

## 🛠️ Solutions

### Option 1: Install MongoDB Locally (Recommended)

#### For Windows:
1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select "Windows" and download the MSI installer

2. **Install MongoDB:**
   - Run the downloaded MSI file
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify Installation:**
   ```cmd
   mongod --version
   mongo --version
   ```

4. **Start MongoDB Service:**
   - MongoDB should start automatically as a Windows service
   - Or manually start: `net start MongoDB`

#### For macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### For Linux (Ubuntu/Debian):
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: Use MongoDB Atlas (Cloud - Free)

1. **Create Account:**
   - Go to: https://www.mongodb.com/atlas
   - Sign up for a free account

2. **Create Cluster:**
   - Choose "Free" tier (M0)
   - Select a region close to you
   - Create cluster

3. **Get Connection String:**
   - Go to "Database Access" → Add New Database User
   - Create username/password
   - Go to "Network Access" → Add IP Address (0.0.0.0/0 for development)
   - Go to "Clusters" → Connect → Connect your application
   - Copy the connection string

4. **Update .env file:**
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/smart-kitchen?retryWrites=true&w=majority
   ```

### Option 3: Use Docker (Alternative)

If you have Docker installed:

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify it's running
docker ps
```

## 🧪 Test Connection

After setting up MongoDB, test the connection:

```bash
# Test MongoDB connection
mongo --eval "db.runCommand('ping')"

# Or using Node.js
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/smart-kitchen').then(() => console.log('Connected!')).catch(err => console.log('Error:', err))"
```

## 🚀 Start the Backend

Once MongoDB is running:

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully!
📊 Database: smart-kitchen
🌐 Host: localhost
🔗 Connection Type: Local
🚀 Server is running on port 8000
```

## 🔧 Troubleshooting

### Common Issues:

1. **"mongod not found"**
   - MongoDB not installed or not in PATH
   - Solution: Install MongoDB or add to PATH

2. **"Connection refused"**
   - MongoDB service not running
   - Solution: Start MongoDB service

3. **"Authentication failed"**
   - Wrong credentials in connection string
   - Solution: Check username/password in .env

4. **"Network timeout"**
   - Firewall blocking connection
   - Solution: Allow MongoDB through firewall

### Windows Specific:
- Check if MongoDB service is running: `services.msc`
- Start service: `net start MongoDB`
- Check logs: `C:\Program Files\MongoDB\Server\6.0\log\mongod.log`

## 📞 Need Help?

If you're still having issues:
1. Check the MongoDB logs
2. Verify your .env file configuration
3. Test connection with MongoDB Compass
4. Try the Atlas cloud option as a fallback

