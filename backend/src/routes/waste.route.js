import { Router } from "express";
import {
    getAllWasteLogs,
    getWasteLogById,
    createWasteLog,
    getWasteStats,
    processExpiredItems,
    getExpiredItems,
    getAllWastePredictions,
    getWastePredictionStats
} from "../controllers/waste.controller.js";
import { verifyAdminOrChef, verifyChef } from "../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Get all waste logs
router.route("/").get(getAllWasteLogs);

// Get waste statistics
router.route("/stats").get(getWasteStats);

// Get expired items for analytics
router.route("/expired").get(getExpiredItems);

// Process expired items and log them as waste
router.route("/process-expired").post(verifyChef, processExpiredItems);

// Create new waste log
router.route("/").post(verifyChef, createWasteLog);

// Get all waste predictions
router.route("/predictions").get(getAllWastePredictions);

// Get waste prediction statistics
router.route("/predictions/stats").get(getWastePredictionStats);

// Get single waste log by ID
router.route("/:id").get(getWasteLogById);

export default router;




