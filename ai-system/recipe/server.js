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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }
  next();
});

app.use("/api/ai", aiRecipeRoutes);

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ AI System running on port ${PORT}`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`🔑 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'NOT SET'}`);
});
