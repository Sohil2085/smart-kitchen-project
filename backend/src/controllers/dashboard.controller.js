import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { InventoryItem } from "../models/inventory/inventoryItem.model.js";
import { Sales } from "../models/demand/salesData.model.js";
import { WasteLog } from "../models/waste/wasteLog.model.js";
import { MenuItem } from "../models/menu/menuItem.model.js";
import { User } from "../models/auth/user.model.js";

// Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Get inventory statistics
        const totalInventoryItems = await InventoryItem.countDocuments();
        const lowStockCount = await InventoryItem.countDocuments({
            $expr: {
                $and: [
                    { $gt: ["$minThreshold", 0] },
                    { $lte: ["$quantity", "$minThreshold"] }
                ]
            }
        });
        const expiredCount = await InventoryItem.countDocuments({
            expiryDate: { $lt: new Date() }
        });
        const outOfStockCount = await InventoryItem.countDocuments({ quantity: 0 });

        // Get sales statistics (total orders/transactions)
        const totalSales = await Sales.countDocuments();
        const totalQuantitySold = await Sales.aggregate([
            { $group: { _id: null, total: { $sum: "$quantitySold" } } }
        ]);
        const totalQuantitySoldValue = totalQuantitySold.length > 0 ? totalQuantitySold[0].total : 0;

        // Get waste statistics
        const totalWasteLogs = await WasteLog.countDocuments();
        const totalWasteQuantity = await WasteLog.aggregate([
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);
        const totalWasteQuantityValue = totalWasteQuantity.length > 0 ? totalWasteQuantity[0].total : 0;

        // Calculate waste reduction percentage (mock calculation for now)
        // In a real scenario, this would be calculated based on historical data
        const wasteReductionPercentage = totalWasteQuantityValue > 0 ? 
            Math.max(0, Math.min(100, Math.round((1 - (totalWasteQuantityValue / (totalInventoryItems * 10))) * 100))) : 15;

        // Get menu items count
        const totalMenuItems = await MenuItem.countDocuments();

        // Get user statistics
        const totalUsers = await User.countDocuments();
        const adminUsers = await User.countDocuments({ role: "admin" });
        const chefUsers = await User.countDocuments({ role: "chef" });

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentInventoryUpdates = await InventoryItem.countDocuments({
            updatedAt: { $gte: sevenDaysAgo }
        });

        const recentSales = await Sales.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const recentWasteLogs = await WasteLog.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get category distribution for inventory
        const categoryStats = await InventoryItem.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get storage condition distribution
        const storageStats = await InventoryItem.aggregate([
            {
                $group: {
                    _id: "$storageCondition",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get waste category distribution
        const wasteCategoryStats = await WasteLog.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const dashboardStats = {
            // Main metrics
            totalOrders: totalSales,
            inventoryItems: totalInventoryItems,
            wasteReduction: wasteReductionPercentage,
            totalMenuItems,
            totalUsers,
            
            // Inventory details
            inventory: {
                total: totalInventoryItems,
                lowStock: lowStockCount,
                expired: expiredCount,
                outOfStock: outOfStockCount,
                categoryStats,
                storageStats
            },
            
            // Sales details
            sales: {
                totalTransactions: totalSales,
                totalQuantitySold: totalQuantitySoldValue,
                recentSales
            },
            
            // Waste details
            waste: {
                totalLogs: totalWasteLogs,
                totalQuantity: totalWasteQuantityValue,
                reductionPercentage: wasteReductionPercentage,
                categoryStats: wasteCategoryStats
            },
            
            // User details
            users: {
                total: totalUsers,
                admins: adminUsers,
                chefs: chefUsers
            },
            
            // Recent activity
            recentActivity: {
                inventoryUpdates: recentInventoryUpdates,
                sales: recentSales,
                wasteLogs: recentWasteLogs
            }
        };

        return res.status(200).json(
            new apiResponse(200, dashboardStats, "Dashboard statistics retrieved successfully")
        );
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw new apiError("Failed to fetch dashboard statistics", 500);
    }
});

// Get dashboard charts data
const getDashboardCharts = asyncHandler(async (req, res) => {
    try {
        // Get sales data for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesChartData = await Sales.aggregate([
            {
                $match: {
                    saleDate: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$saleDate" },
                        month: { $month: "$saleDate" },
                        day: { $dayOfMonth: "$saleDate" }
                    },
                    totalQuantity: { $sum: "$quantitySold" },
                    totalTransactions: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Get waste data for the last 30 days
        const wasteChartData = await WasteLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalQuantity: { $sum: "$quantity" },
                    totalLogs: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Get inventory status distribution
        const inventoryStatusData = await InventoryItem.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const chartsData = {
            sales: salesChartData,
            waste: wasteChartData,
            inventoryStatus: inventoryStatusData
        };

        return res.status(200).json(
            new apiResponse(200, chartsData, "Dashboard charts data retrieved successfully")
        );
    } catch (error) {
        console.error("Error fetching dashboard charts:", error);
        throw new apiError("Failed to fetch dashboard charts data", 500);
    }
});

export {
    getDashboardStats,
    getDashboardCharts
};
