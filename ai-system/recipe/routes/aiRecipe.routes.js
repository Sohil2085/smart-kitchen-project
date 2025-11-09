import express from "express";
import { getPredictedExpiryAndRecipes } from "../controllers/aiRecipe.controller.js";

const router = express.Router();

// POST /api/ai/predict
router.post("/predict", getPredictedExpiryAndRecipes);

export default router;
