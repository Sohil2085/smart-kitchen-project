import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { WasteLog } from "../models/waste/wasteLog.model.js";
import { WastePrediction } from "../models/demand/wastePrediction.model.js";
import { InventoryItem } from "../models/inventory/inventoryItem.model.js";
import { processExpiredItems as processExpiredItemsUtil } from "../utils/expiredItemsHandler.js";

// Get all waste logs
const getAllWasteLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
        filter.category = category;
    }
    
    if (startDate || endDate) {
        filter.loggedAt = {};
        if (startDate) {
            filter.loggedAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.loggedAt.$lte = new Date(endDate);
        }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await WasteLog.countDocuments(filter);

    // Get waste logs with pagination
    const wasteLogs = await WasteLog.find(filter)
        .populate('ingredient', 'name category unit cost')
        .populate('loggedBy', 'fullname email role')
        .sort({ loggedAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Create pagination response object
    const paginatedResponse = {
        docs: wasteLogs,
        totalDocs: total,
        limit: limitNum,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < Math.ceil(total / limitNum) ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
    };

    return res.status(200).json(
        new apiResponse(200, paginatedResponse, "Waste logs retrieved successfully")
    );
});

// Get waste log by ID
const getWasteLogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const wasteLog = await WasteLog.findById(id)
        .populate('ingredient', 'name category unit cost')
        .populate('loggedBy', 'fullname email role');

    if (!wasteLog) {
        throw new apiError(404, "Waste log not found");
    }

    return res.status(200).json(
        new apiResponse(200, wasteLog, "Waste log retrieved successfully")
    );
});

// Create waste log
const createWasteLog = asyncHandler(async (req, res) => {
    const { ingredient, category, quantity, unit, notes, capturedImageUrl } = req.body;

    if (!ingredient || !category || !quantity || !unit) {
        throw new apiError(400, "Missing required fields: ingredient, category, quantity, unit");
    }

    // Verify ingredient exists
    const inventoryItem = await InventoryItem.findById(ingredient);
    if (!inventoryItem) {
        throw new apiError(404, "Ingredient not found");
    }

    // Create waste log
    const wasteLog = await WasteLog.create({
        ingredient,
        category,
        quantity: parseFloat(quantity),
        unit,
        notes,
        capturedImageUrl,
        loggedBy: req.user?._id || null
    });

    // Populate the created waste log
    await wasteLog.populate('ingredient', 'name category unit cost');
    await wasteLog.populate('loggedBy', 'fullname email role');

    return res.status(201).json(
        new apiResponse(201, wasteLog, "Waste log created successfully")
    );
});

// Get waste statistics
const getWasteStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, period = '30d' } = req.query;
    
    // Build date filter
    let dateFilter = {};
    const now = new Date();
    
    if (startDate || endDate) {
        dateFilter.loggedAt = {};
        if (startDate) {
            dateFilter.loggedAt.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.loggedAt.$lte = new Date(endDate);
        }
    } else {
        // Calculate date range based on period
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
        const startDateCalc = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        dateFilter.loggedAt = { $gte: startDateCalc };
    }

    // Get total waste logs count
    const totalWasteLogs = await WasteLog.countDocuments(dateFilter);

    // Get total waste quantity
    const totalWasteQuantity = await WasteLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const totalQuantity = totalWasteQuantity.length > 0 ? totalWasteQuantity[0].total : 0;

    // Get waste by category
    const wasteByCategory = await WasteLog.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: "$category",
                totalQuantity: { $sum: "$quantity" },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalQuantity: -1 } }
    ]);

    // Get waste by ingredient (top 10)
    const wasteByIngredient = await WasteLog.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: "$ingredient",
                totalQuantity: { $sum: "$quantity" },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    // Populate ingredient names
    const wasteByIngredientWithNames = await Promise.all(
        wasteByIngredient.map(async (item) => {
            const ingredient = await InventoryItem.findById(item._id).select('name category unit');
            return {
                ...item,
                ingredient: ingredient
            };
        })
    );

    // Calculate financial loss (if cost is available)
    const wasteLogsWithCost = await WasteLog.find(dateFilter)
        .populate('ingredient', 'cost unit');
    
    let totalFinancialLoss = 0;
    wasteLogsWithCost.forEach(log => {
        if (log.ingredient && log.ingredient.cost) {
            totalFinancialLoss += log.quantity * log.ingredient.cost;
        }
    });

    // Get waste trends (by day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const wasteTrends = await WasteLog.aggregate([
        {
            $match: {
                ...dateFilter,
                loggedAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$loggedAt" },
                    month: { $month: "$loggedAt" },
                    day: { $dayOfMonth: "$loggedAt" }
                },
                totalQuantity: { $sum: "$quantity" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return res.status(200).json(
        new apiResponse(200, {
            totalWasteLogs,
            totalWasteQuantity: totalQuantity,
            totalFinancialLoss,
            wasteByCategory,
            wasteByIngredient: wasteByIngredientWithNames,
            wasteTrends
        }, "Waste statistics retrieved successfully")
    );
});

// Process expired items and log them as waste
const processExpiredItems = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const result = await processExpiredItemsUtil(userId);

        return res.status(200).json(
            new apiResponse(200, result, `Processed ${result.processedCount} expired items. Total waste cost: $${result.totalWasteCost.toFixed(2)}`)
        );
    } catch (error) {
        console.error('Error processing expired items:', error);
        throw new apiError(500, "Failed to process expired items");
    }
});

// Get expired items details for analytics
const getExpiredItems = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate, period = '30d' } = req.query;
        const now = new Date();
        
        // Build date filter for waste logs
        let dateFilter = {};
        
        if (startDate || endDate) {
            dateFilter.loggedAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    throw new apiError(400, "Invalid startDate format");
                }
                dateFilter.loggedAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    throw new apiError(400, "Invalid endDate format");
                }
                dateFilter.loggedAt.$lte = end;
            }
        } else {
            // Calculate date range based on period
            const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
            const startDateCalc = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
            dateFilter.loggedAt = { $gte: startDateCalc };
        }

        // Get expired items from waste logs (category = 'expired')
        // Populate with proper field selection (Mongoose handles null references gracefully)
        const expiredWasteLogs = await WasteLog.find({
            ...dateFilter,
            category: 'expired'
        })
            .populate({
                path: 'ingredient',
                select: 'name category unit cost'
            })
            .populate({
                path: 'loggedBy',
                select: 'fullname email role' // User model has fullname
            })
            .sort({ loggedAt: -1 })
            .lean();

        // Filter out logs with invalid data and calculate statistics safely
        const validLogs = expiredWasteLogs.filter(log => {
            return log && 
                   log.quantity != null && 
                   !isNaN(log.quantity) && 
                   log.loggedAt != null &&
                   !isNaN(new Date(log.loggedAt).getTime());
        });

        // Calculate statistics with null checks
        const totalExpiredItems = validLogs.length;
        const totalExpiredQuantity = validLogs.reduce((sum, log) => {
            const qty = parseFloat(log.quantity) || 0;
            return sum + qty;
        }, 0);
        
        const totalExpiredCost = validLogs.reduce((sum, log) => {
            if (log.ingredient && log.ingredient.cost && log.quantity) {
                const cost = parseFloat(log.ingredient.cost) || 0;
                const qty = parseFloat(log.quantity) || 0;
                return sum + (qty * cost);
            }
            return sum;
        }, 0);

        // Group by ingredient with null safety
        const expiredByIngredient = validLogs.reduce((acc, log) => {
            const ingredientId = log.ingredient?._id?.toString() || 'unknown';
            const qty = parseFloat(log.quantity) || 0;
            
            if (!acc[ingredientId]) {
                acc[ingredientId] = {
                    ingredient: log.ingredient || null,
                    totalQuantity: 0,
                    totalCost: 0,
                    count: 0,
                    logs: []
                };
            }
            acc[ingredientId].totalQuantity += qty;
            if (log.ingredient && log.ingredient.cost) {
                const cost = parseFloat(log.ingredient.cost) || 0;
                acc[ingredientId].totalCost += qty * cost;
            }
            acc[ingredientId].count += 1;
            acc[ingredientId].logs.push(log);
            return acc;
        }, {});

        // Convert to array and sort by total quantity
        const expiredByIngredientArray = Object.values(expiredByIngredient)
            .sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0));

        // Group by date with proper date handling
        const expiredByDate = validLogs.reduce((acc, log) => {
            try {
                if (!log.loggedAt) return acc;
                
                const logDate = new Date(log.loggedAt);
                if (isNaN(logDate.getTime())) return acc;
                
                const dateKey = logDate.toISOString().split('T')[0];
                const qty = parseFloat(log.quantity) || 0;
                
                if (!acc[dateKey]) {
                    acc[dateKey] = {
                        date: dateKey,
                        totalQuantity: 0,
                        totalCost: 0,
                        count: 0
                    };
                }
                acc[dateKey].totalQuantity += qty;
                if (log.ingredient && log.ingredient.cost) {
                    const cost = parseFloat(log.ingredient.cost) || 0;
                    acc[dateKey].totalCost += qty * cost;
                }
                acc[dateKey].count += 1;
            } catch (error) {
                // Skip logs with invalid dates
                console.warn('Skipping log with invalid date:', log._id, error.message);
            }
            return acc;
        }, {});

        // Convert to array and sort by date
        const expiredByDateArray = Object.values(expiredByDate)
            .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });

        return res.status(200).json(
            new apiResponse(200, {
                totalExpiredItems,
                totalExpiredQuantity,
                totalExpiredCost,
                expiredByIngredient: expiredByIngredientArray,
                expiredByDate: expiredByDateArray,
                expiredItems: validLogs
            }, "Expired items retrieved successfully")
        );
    } catch (error) {
        console.error('Error in getExpiredItems:', error);
        // If it's already an apiError, re-throw it
        if (error instanceof apiError) {
            throw error;
        }
        // Otherwise, wrap it in an apiError
        throw new apiError(500, `Failed to retrieve expired items: ${error.message}`);
    }
});

// Get all waste predictions
const getAllWastePredictions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate, predictionModel } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (predictionModel) {
        filter.predictionModel = predictionModel;
    }
    
    if (startDate || endDate) {
        filter.predictionDate = {};
        if (startDate) {
            filter.predictionDate.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.predictionDate.$lte = new Date(endDate);
        }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await WastePrediction.countDocuments(filter);

    // Get waste predictions with pagination
    const wastePredictions = await WastePrediction.find(filter)
        .populate('ingredient', 'name category unit cost expiryDate storageCondition')
        .sort({ predictionDate: -1 })
        .skip(skip)
        .limit(limitNum);

    // Create pagination response object
    const paginatedResponse = {
        docs: wastePredictions,
        totalDocs: total,
        limit: limitNum,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < Math.ceil(total / limitNum) ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
    };

    return res.status(200).json(
        new apiResponse(200, paginatedResponse, "Waste predictions retrieved successfully")
    );
});

// Get waste prediction statistics
const getWastePredictionStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, period = '30d' } = req.query;
    const now = new Date();
    
    // Build date filter
    let dateFilter = {};
    
    if (startDate || endDate) {
        dateFilter.predictionDate = {};
        if (startDate) {
            dateFilter.predictionDate.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.predictionDate.$lte = new Date(endDate);
        }
    } else {
        // Calculate date range based on period
        const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
        const startDateCalc = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        dateFilter.predictionDate = { $gte: startDateCalc };
    }

    // Get total waste predictions count
    const totalPredictions = await WastePrediction.countDocuments(dateFilter);

    // Get total predicted waste quantity
    const totalPredictedQuantity = await WastePrediction.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$predictedWasteQuantity" } } }
    ]);
    const totalQuantity = totalPredictedQuantity.length > 0 ? totalPredictedQuantity[0].total : 0;

    // Get predictions by model
    const predictionsByModel = await WastePrediction.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: "$predictionModel",
                totalQuantity: { $sum: "$predictedWasteQuantity" },
                count: { $sum: 1 },
                avgConfidence: { $avg: "$confidenceScore" }
            }
        },
        { $sort: { totalQuantity: -1 } }
    ]);

    // Get predictions by ingredient (top 10)
    const predictionsByIngredient = await WastePrediction.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: "$ingredient",
                totalQuantity: { $sum: "$predictedWasteQuantity" },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    // Populate ingredient names
    const predictionsByIngredientWithNames = await Promise.all(
        predictionsByIngredient.map(async (item) => {
            const ingredient = await InventoryItem.findById(item._id).select('name category unit cost');
            return {
                ...item,
                ingredient: ingredient
            };
        })
    );

    // Calculate average confidence score
    const avgConfidence = await WastePrediction.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                avgConfidence: { $avg: "$confidenceScore" }
            }
        }
    ]);
    const avgConf = avgConfidence.length > 0 ? avgConfidence[0].avgConfidence : 0;

    return res.status(200).json(
        new apiResponse(200, {
            totalPredictions,
            totalPredictedQuantity: totalQuantity,
            avgConfidence: avgConf,
            predictionsByModel,
            predictionsByIngredient: predictionsByIngredientWithNames
        }, "Waste prediction statistics retrieved successfully")
    );
});

export {
    getAllWasteLogs,
    getWasteLogById,
    createWasteLog,
    getWasteStats,
    processExpiredItems,
    getExpiredItems,
    getAllWastePredictions,
    getWastePredictionStats
};

