import { Router } from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrderStats,
    getInvoice
} from "../controllers/order.controller.js";
import { verifyAdminOrChef, verifyChef } from "../middleware/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyAdminOrChef);

// Get all orders with filtering and pagination
router.route("/").get(getAllOrders);

// Get order statistics
router.route("/stats").get(getOrderStats);

// Create new order (requires chef or admin role)
router.route("/").post(verifyChef, createOrder);

// IMPORTANT: More specific routes must come before parameterized routes
// Get invoice for order (must come before /:id routes)
router.route("/:id/invoice").get(getInvoice);

// Update order status (requires chef or admin role) - specific route before /:id
router.route("/:id/status").put(verifyChef, updateOrderStatus);

// Get single order by ID
router.route("/:id").get(getOrderById);

// Update order (edit order) - requires chef or admin role
router.route("/:id").put(verifyChef, updateOrder);

// Delete order (requires chef or admin role)
router.route("/:id").delete(verifyChef, deleteOrder);

export default router;
