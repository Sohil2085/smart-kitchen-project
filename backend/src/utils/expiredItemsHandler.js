import { InventoryItem } from "../models/inventory/inventoryItem.model.js";
import { WasteLog } from "../models/waste/wasteLog.model.js";
import { WastePrediction } from "../models/demand/wastePrediction.model.js";
import { Inventorylog } from "../models/inventory/inventorylog.model.js";
import { DailyInventoryEntry } from "../models/inventory/dailyInventoryEntry.model.js";

/**
 * Process expired items and log them as waste
 * @param {String} loggedByUserId - User ID who is processing the waste (optional)
 * @returns {Object} - Summary of processed expired items
 */
export const processExpiredItems = async (loggedByUserId = null) => {
    try {
        const now = new Date();
        
        // Find all items that have expired and still have stock
        const expiredItems = await InventoryItem.find({
            expiryDate: { $lt: now },
            currentStock: { $gt: 0 },
            status: { $ne: 'discontinued' }
        });

        // Also process expired daily inventory entries
        const expiredDailyEntries = await DailyInventoryEntry.find({
            expiryDate: { $lt: now },
            remainingQuantity: { $gt: 0 }
        }).populate('inventoryItem');

        const processedItems = [];
        let totalWasteCost = 0;
        const processedItemIds = new Set(); // Track processed items to avoid duplicates

        // Process expired inventory items
        for (const item of expiredItems) {
            try {
                // Skip if already processed
                if (processedItemIds.has(item._id.toString())) {
                    continue;
                }

                // Calculate waste cost (current stock * cost per unit)
                const wasteQuantity = item.currentStock;
                const wasteCost = item.cost ? wasteQuantity * item.cost : 0;
                totalWasteCost += wasteCost;

                // Map unit from inventory to waste log format (they should match now, but handle edge cases)
                let wasteUnit = item.unit;
                // Convert 'ltr' to 'litre' if needed (though we fixed the enum, keep this for safety)
                if (wasteUnit === 'ltr') {
                    wasteUnit = 'ltr'; // Keep as is since we fixed the enum
                }

                // Create waste log entry
                const wasteLog = await WasteLog.create({
                    ingredient: item._id,
                    category: 'expired',
                    quantity: wasteQuantity,
                    unit: wasteUnit,
                    loggedBy: loggedByUserId,
                    loggedAt: now,
                    notes: `Automatically logged expired item. Expired on ${item.expiryDate.toLocaleDateString()}`
                });

                // Create inventory log entry for tracking
                await Inventorylog.create({
                    ingredient: item._id,
                    change: -wasteQuantity,
                    reason: 'Item expired - moved to waste',
                    date: now
                });

                // Create waste prediction record for analytics
                await WastePrediction.create({
                    ingredient: item._id,
                    predictedWasteQuantity: wasteQuantity,
                    predictionDate: now,
                    predictionModel: 'Expired',
                    confidenceScore: 1.0, // 100% confidence since item is already expired
                    additionalNotes: `Item expired on ${item.expiryDate.toLocaleDateString()}. Automatically moved to waste.`
                });

                // Update inventory item - set stock to 0 and status to expired
                await InventoryItem.findByIdAndUpdate(
                    item._id,
                    {
                        currentStock: 0,
                        quantity: 0, // Also update quantity to match
                        status: 'expired',
                        lastUpdatedBy: loggedByUserId
                    }
                );

                processedItems.push({
                    itemId: item._id,
                    name: item.name,
                    quantity: wasteQuantity,
                    unit: wasteUnit,
                    wasteCost: wasteCost,
                    wasteLogId: wasteLog._id,
                    expiryDate: item.expiryDate
                });
                
                processedItemIds.add(item._id.toString());
            } catch (error) {
                console.error(`Error processing expired item ${item._id}:`, error);
                // Continue with other items even if one fails
            }
        }

        // Process expired daily inventory entries
        for (const entry of expiredDailyEntries) {
            try {
                // Skip if entry doesn't have inventory item
                if (!entry.inventoryItem || !entry.inventoryItem._id) {
                    continue;
                }

                // Skip if the inventory item was already processed
                const itemId = entry.inventoryItem._id.toString();
                if (processedItemIds.has(itemId)) {
                    // Update the daily entry to mark it as processed
                    entry.remainingQuantity = 0;
                    await entry.save();
                    continue;
                }

                const item = entry.inventoryItem;
                const wasteQuantity = entry.remainingQuantity;
                const wasteCost = entry.cost ? wasteQuantity * entry.cost : (item.cost ? wasteQuantity * item.cost : 0);
                totalWasteCost += wasteCost;

                // Create waste log entry for this expired daily entry
                const wasteLog = await WasteLog.create({
                    ingredient: itemId,
                    category: 'expired',
                    quantity: wasteQuantity,
                    unit: item.unit,
                    loggedBy: loggedByUserId,
                    loggedAt: now,
                    notes: `Automatically logged expired daily inventory entry. Expired on ${entry.expiryDate ? entry.expiryDate.toLocaleDateString() : 'unknown date'}`
                });

                // Create inventory log entry for tracking
                await Inventorylog.create({
                    ingredient: itemId,
                    change: -wasteQuantity,
                    reason: 'Daily inventory entry expired - moved to waste',
                    date: now
                });

                // Create waste prediction record for analytics
                await WastePrediction.create({
                    ingredient: itemId,
                    predictedWasteQuantity: wasteQuantity,
                    predictionDate: now,
                    predictionModel: 'Expired',
                    confidenceScore: 1.0, // 100% confidence since item is already expired
                    additionalNotes: `Daily inventory entry expired on ${entry.expiryDate ? entry.expiryDate.toLocaleDateString() : 'unknown date'}. Automatically moved to waste.`
                });

                // Update the daily entry to mark it as processed
                entry.remainingQuantity = 0;
                await entry.save();

                // Update inventory item stock if it hasn't been updated yet
                const currentItem = await InventoryItem.findById(itemId);
                if (currentItem && currentItem.currentStock > 0) {
                    const newStock = Math.max(0, currentItem.currentStock - wasteQuantity);
                    await InventoryItem.findByIdAndUpdate(
                        itemId,
                        {
                            currentStock: newStock,
                            status: newStock === 0 ? 'expired' : currentItem.status,
                            lastUpdatedBy: loggedByUserId
                        }
                    );
                }

                processedItems.push({
                    itemId: itemId,
                    name: item.name,
                    quantity: wasteQuantity,
                    unit: item.unit,
                    wasteCost: wasteCost,
                    wasteLogId: wasteLog._id,
                    expiryDate: entry.expiryDate,
                    source: 'daily_inventory'
                });
                
                processedItemIds.add(itemId);
            } catch (error) {
                console.error(`Error processing expired daily entry ${entry._id}:`, error);
                // Continue with other entries even if one fails
            }
        }

        return {
            success: true,
            processedCount: processedItems.length,
            totalWasteCost: totalWasteCost,
            processedItems: processedItems
        };
    } catch (error) {
        console.error('Error processing expired items:', error);
        throw error;
    }
};

/**
 * Check and update expired item statuses (called periodically)
 */
export const checkExpiredItems = async () => {
    try {
        const now = new Date();
        
        // Update status of expired items
        await InventoryItem.updateMany(
            {
                expiryDate: { $lt: now },
                status: { $ne: 'expired', $ne: 'discontinued' }
            },
            {
                $set: { status: 'expired' }
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error checking expired items:', error);
        throw error;
    }
};







