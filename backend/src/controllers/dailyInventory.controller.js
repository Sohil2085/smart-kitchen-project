import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { DailyInventoryEntry } from "../models/inventory/dailyInventoryEntry.model.js";
import { DayStatus } from "../models/inventory/dayStatus.model.js";
import { InventoryItem } from "../models/inventory/inventoryItem.model.js";

// Helper function to get today's date at midnight
const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Get today's inventory entries
const getTodayInventory = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    
    const entries = await DailyInventoryEntry.find({ date: today })
        .populate('inventoryItem')
        .populate('addedBy', 'fullname email')
        .sort({ createdAt: -1 });

    // Get day status
    const dayStatus = await DayStatus.findOne({ date: today });

    return res.status(200).json(
        new apiResponse(200, {
            entries,
            date: formatDate(today),
            isDayEnded: dayStatus?.isEnded || false
        }, "Today's inventory retrieved successfully")
    );
});

// Get inventory for a specific date
const getDateInventory = asyncHandler(async (req, res) => {
    const { date } = req.params;
    
    if (!date) {
        throw new apiError("Date parameter is required", 400);
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const entries = await DailyInventoryEntry.find({ date: targetDate })
        .populate('inventoryItem')
        .populate('addedBy', 'fullname email')
        .sort({ createdAt: -1 });

    const dayStatus = await DayStatus.findOne({ date: targetDate });

    return res.status(200).json(
        new apiResponse(200, {
            entries,
            date: formatDate(targetDate),
            isDayEnded: dayStatus?.isEnded || false
        }, "Date inventory retrieved successfully")
    );
});

// Add item to today's inventory
// IMPORTANT: General inventory (InventoryItem.currentStock) is the SINGLE SOURCE OF TRUTH for stock
// Daily inventory entries are just TRACKING entries for FIFO and daily usage tracking
const addItemToToday = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    
    // Check if day is ended
    const dayStatus = await DayStatus.findOne({ date: today });
    if (dayStatus?.isEnded) {
        throw new apiError("Cannot add items. The day has been ended.", 400);
    }

    const { inventoryItemId, quantity, cost, expiryDate } = req.body;

    if (!inventoryItemId || !quantity) {
        throw new apiError("Inventory item ID and quantity are required", 400);
    }

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new apiError("Quantity must be a positive number", 400);
    }

    // Verify inventory item exists
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError("Inventory item not found", 404);
    }

    // Parse cost if provided
    const parsedCost = cost !== undefined && cost !== null && cost !== '' ? Number(cost) : undefined;
    if (parsedCost !== undefined && (Number.isNaN(parsedCost) || parsedCost < 0)) {
        throw new apiError("Cost must be a non-negative number", 400);
    }

    // Parse expiry date if provided
    let finalExpiryDate = null;
    if (expiryDate) {
        finalExpiryDate = new Date(expiryDate);
    }

    // STEP 1: Update general inventory stock (SINGLE SOURCE OF TRUTH)
    // This is the ONLY place where actual stock is stored
    const updatedInventoryItem = await InventoryItem.findByIdAndUpdate(
        inventoryItemId,
        {
            $inc: { currentStock: parsedQuantity },
            lastUpdatedBy: req.user._id
        },
        { new: true }
    );

    if (!updatedInventoryItem) {
        throw new apiError("Failed to update inventory item", 500);
    }

    // STEP 2: Create daily inventory entry (TRACKING ONLY - for FIFO and daily usage tracking)
    // This entry tracks what was added today and what's remaining for FIFO purposes
    // It does NOT hold actual stock - it's just a tracking/log entry
    const entry = await DailyInventoryEntry.create({
        date: today,
        inventoryItem: inventoryItemId,
        quantity: parsedQuantity,
        remainingQuantity: parsedQuantity, // For FIFO tracking - tracks how much is left from this batch
        cost: parsedCost,
        expiryDate: finalExpiryDate,
        addedBy: req.user._id
    });

    const populatedEntry = await DailyInventoryEntry.findById(entry._id)
        .populate('inventoryItem')
        .populate('addedBy', 'fullname email');

    return res.status(201).json(
        new apiResponse(201, populatedEntry, "Item added to today's inventory successfully")
    );
});

// Deduct quantity from inventory (used when orders are made)
// IMPORTANT: General inventory (InventoryItem.currentStock) is the SINGLE SOURCE OF TRUTH
// We deduct from general inventory first, then update daily inventory entries for FIFO tracking
const deductFromDailyInventory = asyncHandler(async (inventoryItemId, quantity, userId) => {
    const today = getTodayDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // STEP 1: Get the inventory item and check stock in GENERAL INVENTORY (SINGLE SOURCE OF TRUTH)
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(`Inventory item ${inventoryItemId} not found`, 404);
    }

    // Check if general inventory has sufficient stock
    if (inventoryItem.currentStock < quantity) {
        throw new apiError(
            `Insufficient stock for ${inventoryItem.name}. Required: ${quantity}, Available: ${inventoryItem.currentStock}`,
            400
        );
    }
    
    // STEP 2: Deduct from GENERAL INVENTORY (SINGLE SOURCE OF TRUTH)
    // This is the ONLY place where actual stock is reduced
    const updatedItem = await InventoryItem.findByIdAndUpdate(
        inventoryItemId,
        {
            $inc: { currentStock: -quantity },
            lastUpdatedBy: userId
        },
        { new: true }
    );

    if (!updatedItem) {
        throw new apiError(`Failed to update inventory item ${inventoryItemId}`, 500);
    }

    // STEP 3: Update daily inventory entries for FIFO tracking (TRACKING ONLY)
    // Find today's entries for this inventory item, ordered by expiry date (FIFO)
    // Use date range query to handle timezone issues
    const entries = await DailyInventoryEntry.find({
        date: {
            $gte: today,
            $lt: tomorrow
        },
        inventoryItem: inventoryItemId,
        remainingQuantity: { $gt: 0 }
    }).sort({ expiryDate: 1, createdAt: 1 }); // Use earliest expiry first, then earliest added

    let remainingToTrack = quantity;
    const now = new Date();

    // Update daily inventory entries for FIFO tracking
    // This is just for tracking purposes - the actual stock was already deducted above
    if (entries.length > 0) {
        for (const entry of entries) {
            if (remainingToTrack <= 0) break;

            // Skip expired items in tracking (they shouldn't be used)
            if (entry.expiryDate && new Date(entry.expiryDate) < now) {
                continue;
            }

            // Update remainingQuantity for FIFO tracking
            const trackAmount = Math.min(entry.remainingQuantity, remainingToTrack);
            entry.remainingQuantity -= trackAmount;
            remainingToTrack -= trackAmount;
            await entry.save();
        }
    }

    // Note: If there are no daily inventory entries or we couldn't track all of it,
    // that's okay - the stock was already deducted from general inventory.
    // Daily inventory entries are just for tracking/FIFO purposes, not for holding actual stock.
});

// End the day
const endDay = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    
    // Check if day is already ended
    let dayStatus = await DayStatus.findOne({ date: today });
    if (dayStatus?.isEnded) {
        throw new apiError("The day has already been ended", 400);
    }

    // Create or update day status
    if (!dayStatus) {
        dayStatus = await DayStatus.create({
            date: today,
            isEnded: true,
            endedAt: new Date(),
            endedBy: req.user._id
        });
    } else {
        dayStatus.isEnded = true;
        dayStatus.endedAt = new Date();
        dayStatus.endedBy = req.user._id;
        await dayStatus.save();
    }

    return res.status(200).json(
        new apiResponse(200, { date: formatDate(today), isEnded: true }, "Day ended successfully")
    );
});

// Start new day (carry forward non-expired items from yesterday)
const startNewDay = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Check if today is already started
    const todayStatus = await DayStatus.findOne({ date: today });
    if (todayStatus?.isEnded) {
        throw new apiError("Today's day has already been ended. Cannot start a new day.", 400);
    }

    // Check if yesterday was ended
    const yesterdayStatus = await DayStatus.findOne({ date: yesterday });
    if (!yesterdayStatus?.isEnded) {
        throw new apiError("Yesterday's day must be ended before starting a new day", 400);
    }

    // Get yesterday's entries with remaining quantity
    const yesterdayEntries = await DailyInventoryEntry.find({
        date: yesterday,
        remainingQuantity: { $gt: 0 }
    }).populate('inventoryItem');

    const now = new Date();
    const carriedForward = [];

    // Carry forward non-expired items
    for (const entry of yesterdayEntries) {
        // Check if expired
        if (entry.expiryDate && new Date(entry.expiryDate) < now) {
            continue; // Skip expired items
        }

        // Create new entry for today with remaining quantity
        const newEntry = await DailyInventoryEntry.create({
            date: today,
            inventoryItem: entry.inventoryItem._id,
            quantity: entry.remainingQuantity,
            remainingQuantity: entry.remainingQuantity,
            cost: entry.cost,
            expiryDate: entry.expiryDate,
            addedBy: req.user._id
        });

        carriedForward.push({
            itemName: entry.inventoryItem.name,
            quantity: entry.remainingQuantity,
            unit: entry.inventoryItem.unit
        });
    }

    return res.status(200).json(
        new apiResponse(200, {
            date: formatDate(today),
            carriedForwardCount: carriedForward.length,
            carriedForward
        }, "New day started successfully. Non-expired items carried forward from yesterday.")
    );
});

// Get day status
const getDayStatus = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    
    const dayStatus = await DayStatus.findOne({ date: today });

    return res.status(200).json(
        new apiResponse(200, {
            date: formatDate(today),
            isDayEnded: dayStatus?.isEnded || false,
            endedAt: dayStatus?.endedAt || null
        }, "Day status retrieved successfully")
    );
});

// Get available items for today (items that can be added)
const getAvailableItemsForToday = asyncHandler(async (req, res) => {
    // Get all inventory items (generalized items)
    const items = await InventoryItem.find({})
        .populate('addedBy', 'fullname')
        .sort({ name: 1 });

    return res.status(200).json(
        new apiResponse(200, items, "Available items retrieved successfully")
    );
});

// Get previous day's remaining items
const getPreviousDayRemainingItems = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Get yesterday's entries with remaining quantity
    const yesterdayEntries = await DailyInventoryEntry.find({
        date: yesterday,
        remainingQuantity: { $gt: 0 }
    })
    .populate('inventoryItem')
    .sort({ createdAt: -1 });

    const now = new Date();
    const remainingItems = [];

    // Filter out expired items and format response
    for (const entry of yesterdayEntries) {
        // Check if expired
        if (entry.expiryDate && new Date(entry.expiryDate) < now) {
            continue; // Skip expired items
        }

        remainingItems.push({
            entryId: entry._id,
            inventoryItemId: entry.inventoryItem._id,
            itemName: entry.inventoryItem.name,
            quantity: entry.remainingQuantity,
            unit: entry.inventoryItem.unit,
            cost: entry.cost,
            expiryDate: entry.expiryDate,
            category: entry.inventoryItem.category,
            storageCondition: entry.inventoryItem.storageCondition
        });
    }

    return res.status(200).json(
        new apiResponse(200, {
            date: formatDate(yesterday),
            items: remainingItems,
            count: remainingItems.length
        }, "Previous day's remaining items retrieved successfully")
    );
});

// Manually add remaining items from previous day to today
const addPreviousDayRemainingItems = asyncHandler(async (req, res) => {
    const today = getTodayDate();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Check if day is ended
    const dayStatus = await DayStatus.findOne({ date: today });
    if (dayStatus?.isEnded) {
        throw new apiError("Cannot add items. The day has been ended.", 400);
    }

    // Get yesterday's entries with remaining quantity
    const yesterdayEntries = await DailyInventoryEntry.find({
        date: yesterday,
        remainingQuantity: { $gt: 0 }
    }).populate('inventoryItem');

    const now = new Date();
    const addedItems = [];
    const skippedItems = [];

    // Add non-expired items to today
    for (const entry of yesterdayEntries) {
        // Check if expired
        if (entry.expiryDate && new Date(entry.expiryDate) < now) {
            skippedItems.push({
                itemName: entry.inventoryItem.name,
                reason: 'Expired'
            });
            continue; // Skip expired items
        }

        // Check if this item already exists in today's inventory with same expiry date
        // Match by inventory item and expiry date (or both null)
        const existingEntryQuery = {
            date: today,
            inventoryItem: entry.inventoryItem._id
        };
        
        // Match expiry date if provided, otherwise match entries with no expiry date
        if (entry.expiryDate) {
            existingEntryQuery.expiryDate = entry.expiryDate;
        } else {
            existingEntryQuery.$or = [
                { expiryDate: null },
                { expiryDate: { $exists: false } }
            ];
        }
        
        const existingEntry = await DailyInventoryEntry.findOne(existingEntryQuery);

        if (existingEntry) {
            // Update existing entry by adding remaining quantity
            existingEntry.quantity += entry.remainingQuantity;
            existingEntry.remainingQuantity += entry.remainingQuantity;
            await existingEntry.save();
            addedItems.push({
                itemName: entry.inventoryItem.name,
                quantity: entry.remainingQuantity,
                unit: entry.inventoryItem.unit,
                action: 'Updated existing entry'
            });
        } else {
            // Create new entry for today with remaining quantity
            const newEntry = await DailyInventoryEntry.create({
                date: today,
                inventoryItem: entry.inventoryItem._id,
                quantity: entry.remainingQuantity,
                remainingQuantity: entry.remainingQuantity,
                cost: entry.cost,
                expiryDate: entry.expiryDate,
                addedBy: req.user._id
            });

            addedItems.push({
                itemName: entry.inventoryItem.name,
                quantity: entry.remainingQuantity,
                unit: entry.inventoryItem.unit,
                action: 'Added new entry'
            });
        }
    }

    return res.status(200).json(
        new apiResponse(200, {
            date: formatDate(today),
            addedCount: addedItems.length,
            skippedCount: skippedItems.length,
            addedItems,
            skippedItems
        }, "Remaining items from previous day added successfully")
    );
});

export {
    getTodayInventory,
    getDateInventory,
    addItemToToday,
    deductFromDailyInventory,
    endDay,
    startNewDay,
    getDayStatus,
    getAvailableItemsForToday,
    getPreviousDayRemainingItems,
    addPreviousDayRemainingItems
};

