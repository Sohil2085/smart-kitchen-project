import { Router } from "express";
import {
    getAllInventoryItems,
    getInventoryItemById,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getLowStockItems,
    getExpiredItems,
    getNearExpiryItems,
    getItemsByCategory,
    getInventoryStats,
    exportInventoryToCSV,
    processExpiredInventoryItems,
    applyDailyIntake,
    detectSpoilage
} from "../controllers/inventory.controller.js";
import { verifyAdminOrChef, verifyChef } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Get all inventory items with filtering and pagination
router.route("/").get(getAllInventoryItems);

// Get inventory statistics
router.route("/stats").get(getInventoryStats);

// Export inventory to CSV
router.route("/export").get(exportInventoryToCSV);


// Get low stock items
router.route("/low-stock").get(getLowStockItems);

// Get expired items
router.route("/expired").get(getExpiredItems);

// Get near-expiry items (expiring within specified days, default 3)
router.route("/near-expiry").get(getNearExpiryItems);

// Process expired items and log them as waste
router.route("/process-expired").post(verifyChef, processExpiredInventoryItems);

// Get items by category
router.route("/category/:category").get(getItemsByCategory);

// Add new inventory item (requires chef or admin role)
router.route("/").post(
    verifyChef,
    upload.single("image"),
    addInventoryItem
);

// Get single inventory item by ID
router.route("/:id").get(getInventoryItemById);

// Update inventory item (requires chef or admin role)
router.route("/:id").put(
    verifyChef,
    upload.single("image"),
    updateInventoryItem
);

// Delete inventory item (requires chef or admin role)
router.route("/:id").delete(verifyChef, deleteInventoryItem);

// Detect spoilage in fruits and vegetables (requires chef or admin role)
router.route("/detect-spoilage").post(
    verifyChef,
    upload.single("image"),
    detectSpoilage
);

export default router;
