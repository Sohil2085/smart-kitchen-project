import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV
});

import connectDB  from "./src/db/index.js";
import { app } from "./app.js";
import { PORT } from "./constant.js";

const startServer = async () => {
  try {
    await connectDB(); // wait until DB connects
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

startServer();
