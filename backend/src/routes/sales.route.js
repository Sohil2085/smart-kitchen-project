import { Router } from "express";
import {
    getSalesAnalytics,
    getSalesTrends,
    getTopProducts,
    getSalesByCategory,
    getProfitMarginAnalysis
} from "../controllers/sales.controller.js";
import { verifyAdminOrChef } from "../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Get comprehensive sales analytics
router.route("/analytics").get(getSalesAnalytics);

// Get sales trends over time
router.route("/trends").get(getSalesTrends);

// Get top performing products
router.route("/top-products").get(getTopProducts);

// Get sales by category analysis
router.route("/by-category").get(getSalesByCategory);

// Get profit margin analysis
router.route("/profit-margin").get(getProfitMarginAnalysis);

export default router;
