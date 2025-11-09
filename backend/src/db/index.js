import mongoose from "mongoose";
import { DB_NAME } from "../../constant.js";

const connectDB = async () => {
    try {
        // MongoDB Atlas connection string format:
        // mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error("MONGODB_URI environment variable is required. Please set up your MongoDB Atlas connection string.");
        }
        
        const connectionInstance = await mongoose.connect(mongoUri);
        
        console.log(`\n✅ MongoDB Connected Successfully!`);
        console.log(`📊 Database: ${connectionInstance.connection.name}`);
        console.log(`🌐 Host: ${connectionInstance.connection.host}`);
        console.log(`🔗 Connection Type: Atlas (Cloud)`);
        
    } catch (error) {
        console.log("❌ MongoDB Connection Error:", error.message);
        console.log("💡 Please ensure you have set the MONGODB_URI environment variable with your MongoDB Atlas connection string.");
        console.log("📝 Example: mongodb+srv://username:password@cluster.mongodb.net/smart-kitchen?retryWrites=true&w=majority");
        process.exit(1);
    }
}


export default connectDB