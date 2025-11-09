import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Sales } from "../models/demand/salesData.model.js";
import { MenuItem } from "../models/menu/menuItem.model.js";
import { Order } from "../models/order/order.model.js";

// Get comprehensive sales analytics
const getSalesAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, period = '30d' } = req.query;
    
    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
        dateFilter = {
            saleDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
    } else {
        // Default to last 30 days
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        dateFilter = {
            saleDate: { $gte: startDate }
        };
    }

    // Get sales data with menu item details
    const salesData = await Sales.aggregate([
        { $match: dateFilter },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: '$product',
                totalQuantitySold: { $sum: '$quantitySold' },
                totalSales: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalCost: { $sum: { $multiply: ['$quantitySold', '$menuItem.baseCost'] } },
                menuItem: { $first: '$menuItem' },
                salesCount: { $sum: 1 }
            }
        },
        {
            $addFields: {
                profitMargin: {
                    $multiply: [
                        { $divide: [{ $subtract: ['$totalSales', '$totalCost'] }, '$totalSales'] },
                        100
                    ]
                },
                profitAmount: { $subtract: ['$totalSales', '$totalCost'] }
            }
        },
        { $sort: { totalSales: -1 } }
    ]);

    // Get overall statistics
    const overallStats = await Sales.aggregate([
        { $match: dateFilter },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalCost: { $sum: { $multiply: ['$quantitySold', '$menuItem.baseCost'] } },
                totalQuantitySold: { $sum: '$quantitySold' },
                totalOrders: { $sum: 1 },
                uniqueProducts: { $addToSet: '$product' }
            }
        },
        {
            $addFields: {
                totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
                averageOrderValue: { $divide: ['$totalRevenue', '$totalOrders'] },
                uniqueProductCount: { $size: '$uniqueProducts' }
            }
        }
    ]);

    const stats = overallStats[0] || {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalQuantitySold: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        uniqueProductCount: 0
    };

    if (stats.totalRevenue > 0) {
        stats.overallProfitMargin = ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(2);
    } else {
        stats.overallProfitMargin = 0;
    }

    return res.status(200).json(
        new apiResponse(200, {
            salesData,
            overallStats: stats,
            dateRange: {
                startDate: dateFilter.saleDate?.$gte || new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
                endDate: dateFilter.saleDate?.$lte || now
            }
        }, "Sales analytics retrieved successfully")
    );
});

// Get sales trends over time
const getSalesTrends = asyncHandler(async (req, res) => {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    let groupFormat;
    if (groupBy === 'hour') {
        groupFormat = {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' },
            hour: { $hour: '$saleDate' }
        };
    } else if (groupBy === 'week') {
        groupFormat = {
            year: { $year: '$saleDate' },
            week: { $week: '$saleDate' }
        };
    } else {
        groupFormat = {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
            day: { $dayOfMonth: '$saleDate' }
        };
    }

    const trends = await Sales.aggregate([
        {
            $match: {
                saleDate: { $gte: startDate }
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: groupFormat,
                totalRevenue: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalCost: { $sum: { $multiply: ['$quantitySold', '$menuItem.baseCost'] } },
                totalQuantitySold: { $sum: '$quantitySold' },
                totalOrders: { $sum: 1 }
            }
        },
        {
            $addFields: {
                profit: { $subtract: ['$totalRevenue', '$totalCost'] },
                profitMargin: {
                    $cond: {
                        if: { $gt: ['$totalRevenue', 0] },
                        then: { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] }, 100] },
                        else: 0
                    }
                }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    return res.status(200).json(
        new apiResponse(200, {
            trends,
            period,
            groupBy,
            dateRange: { startDate, endDate: now }
        }, "Sales trends retrieved successfully")
    );
});

// Get top performing products
const getTopProducts = asyncHandler(async (req, res) => {
    const { limit = 10, sortBy = 'revenue', period = '30d' } = req.query;
    
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    let sortField;
    switch (sortBy) {
        case 'quantity':
            sortField = { totalQuantitySold: -1 };
            break;
        case 'profit':
            sortField = { profitAmount: -1 };
            break;
        case 'margin':
            sortField = { profitMargin: -1 };
            break;
        default:
            sortField = { totalSales: -1 };
    }

    const topProducts = await Sales.aggregate([
        {
            $match: {
                saleDate: { $gte: startDate }
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: '$product',
                totalQuantitySold: { $sum: '$quantitySold' },
                totalSales: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalCost: { $sum: { $multiply: ['$quantitySold', '$menuItem.baseCost'] } },
                menuItem: { $first: '$menuItem' },
                salesCount: { $sum: 1 }
            }
        },
        {
            $addFields: {
                profitMargin: {
                    $cond: {
                        if: { $gt: ['$totalSales', 0] },
                        then: { $multiply: [{ $divide: [{ $subtract: ['$totalSales', '$totalCost'] }, '$totalSales'] }, 100] },
                        else: 0
                    }
                },
                profitAmount: { $subtract: ['$totalSales', '$totalCost'] }
            }
        },
        { $sort: sortField },
        { $limit: parseInt(limit) }
    ]);

    return res.status(200).json(
        new apiResponse(200, {
            topProducts,
            sortBy,
            period,
            limit: parseInt(limit)
        }, "Top products retrieved successfully")
    );
});

// Get sales by category/type analysis
const getSalesByCategory = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get sales by day of week
    const salesByDay = await Sales.aggregate([
        {
            $match: {
                saleDate: { $gte: startDate }
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: '$dayOfWeek',
                totalRevenue: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalQuantitySold: { $sum: '$quantitySold' },
                totalOrders: { $sum: 1 }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);

    // Get sales by season
    const salesBySeason = await Sales.aggregate([
        {
            $match: {
                saleDate: { $gte: startDate }
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: '$season',
                totalRevenue: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalQuantitySold: { $sum: '$quantitySold' },
                totalOrders: { $sum: 1 }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);

    // Get sales by order type
    const salesByOrderType = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: 'delivered'
            }
        },
        {
            $group: {
                _id: '$orderType',
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 },
                averageOrderValue: { $avg: '$totalAmount' }
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);

    return res.status(200).json(
        new apiResponse(200, {
            salesByDay,
            salesBySeason,
            salesByOrderType,
            period
        }, "Sales by category analysis retrieved successfully")
    );
});

// Get profit margin analysis
const getProfitMarginAnalysis = asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    const profitAnalysis = await Sales.aggregate([
        {
            $match: {
                saleDate: { $gte: startDate }
            }
        },
        {
            $lookup: {
                from: 'menuitems',
                localField: 'product',
                foreignField: '_id',
                as: 'menuItem'
            }
        },
        { $unwind: '$menuItem' },
        {
            $group: {
                _id: '$product',
                totalRevenue: { $sum: { $multiply: ['$quantitySold', '$menuItem.suggestedPrice'] } },
                totalCost: { $sum: { $multiply: ['$quantitySold', '$menuItem.baseCost'] } },
                totalQuantitySold: { $sum: '$quantitySold' },
                menuItem: { $first: '$menuItem' }
            }
        },
        {
            $addFields: {
                profitAmount: { $subtract: ['$totalRevenue', '$totalCost'] },
                profitMargin: {
                    $cond: {
                        if: { $gt: ['$totalRevenue', 0] },
                        then: { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] }, 100] },
                        else: 0
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                products: { $push: '$$ROOT' },
                totalRevenue: { $sum: '$totalRevenue' },
                totalCost: { $sum: '$totalCost' },
                totalProfit: { $sum: '$profitAmount' },
                averageMargin: { $avg: '$profitMargin' },
                highMarginProducts: {
                    $sum: {
                        $cond: [{ $gte: ['$profitMargin', 50] }, 1, 0]
                    }
                },
                lowMarginProducts: {
                    $sum: {
                        $cond: [{ $lt: ['$profitMargin', 20] }, 1, 0]
                    }
                }
            }
        },
        {
            $addFields: {
                overallMargin: {
                    $multiply: [{ $divide: ['$totalProfit', '$totalRevenue'] }, 100]
                }
            }
        }
    ]);

    const analysis = profitAnalysis[0] || {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        overallMargin: 0,
        averageMargin: 0,
        highMarginProducts: 0,
        lowMarginProducts: 0,
        products: []
    };

    return res.status(200).json(
        new apiResponse(200, {
            analysis,
            period
        }, "Profit margin analysis retrieved successfully")
    );
});

export {
    getSalesAnalytics,
    getSalesTrends,
    getTopProducts,
    getSalesByCategory,
    getProfitMarginAnalysis
};
