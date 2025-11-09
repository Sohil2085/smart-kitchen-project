import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import aiRecipeRoutes from "./routes/aiRecipe.routes.js";

dotenv.config();
const app = express();

// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Default Vite dev server port
  credentials: true
}));

app.use(express.json());
app.use("/api/ai", aiRecipeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ AI System running on port ${PORT}`));
