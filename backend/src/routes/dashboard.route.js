import { Router } from "express";
import {
    getDashboardStats,
    getDashboardCharts
} from "../controllers/dashboard.controller.js";
import { verifyAdminOrChef } from "../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Get dashboard statistics
router.route("/stats").get(getDashboardStats);

// Get dashboard charts data
router.route("/charts").get(getDashboardCharts);

export default router;
