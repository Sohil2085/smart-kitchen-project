import express from "express";
import dotenv from "dotenv";
import aiRecipeRoutes from "./routes/aiRecipe.routes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/ai", aiRecipeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ AI System running on port ${PORT}`));
