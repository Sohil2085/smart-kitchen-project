import { Router } from "express";
import {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllRecipeRecommendations,
    createRecipeRecommendation,
    getAvailableIngredients,
    checkMenuItemStockStatus,
    updateAllMenuItemsStockStatus
} from "../controllers/menu.controller.js";
import { verifyAdminOrChef, verifyChef } from "../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Menu Items Routes
// Get all menu items with filtering and pagination
router.route("/items").get(getAllMenuItems);

// Get available ingredients for menu creation
router.route("/ingredients").get(getAvailableIngredients);

// Create new menu item (requires chef or admin role)
router.route("/items").post(verifyChef, createMenuItem);

// Get single menu item by ID
router.route("/items/:id").get(getMenuItemById);

// Update menu item (requires chef or admin role)
router.route("/items/:id").put(verifyChef, updateMenuItem);

// Delete menu item (requires chef or admin role)
router.route("/items/:id").delete(verifyChef, deleteMenuItem);

// Check stock status for a specific menu item
router.route("/items/:id/stock-status").get(checkMenuItemStockStatus);

// Update stock status for all menu items
router.route("/items/update-stock-status").post(updateAllMenuItemsStockStatus);

// Recipe Recommendations Routes
// Get all recipe recommendations
router.route("/recipes").get(getAllRecipeRecommendations);

// Create new recipe recommendation (requires chef or admin role)
router.route("/recipes").post(verifyChef, createRecipeRecommendation);

export default router;
