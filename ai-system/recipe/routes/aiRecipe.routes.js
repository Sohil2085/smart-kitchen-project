import express from "express";
import { getPredictedExpiryAndRecipes } from "../controllers/aiRecipe.controller.js";

const router = express.Router();

// Async error wrapper to catch unhandled promise rejections
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/ai/predict
router.post("/predict", asyncHandler(getPredictedExpiryAndRecipes));

export default router;
