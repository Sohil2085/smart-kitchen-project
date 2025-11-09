import { InventoryItem } from "../models/inventory/inventoryItem.model.js";

/**
 * Find alternative available inventory items with the same name
 * @param {String} ingredientName - Name of the ingredient to search for
 * @param {String} excludeId - ID to exclude from search (the original item)
 * @param {String} requiredUnit - Required unit for the ingredient
 * @returns {Object|null} - Available inventory item or null
 */
const findAlternativeIngredient = async (ingredientName, excludeId, requiredUnit) => {
    const now = new Date();
    
    // Find all items with the same name, excluding expired items and the original item
    // Only check actual expiry date, not status field
    const alternatives = await InventoryItem.find({
        name: ingredientName,
        _id: { $ne: excludeId },
        currentStock: { $gt: 0 },
        $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: now } }
        ]
    }).sort({ expiryDate: 1, currentStock: -1 }); // Prefer items with later expiry and more stock
    
    // Try to find an item with matching unit first
    const matchingUnit = alternatives.find(item => item.unit === requiredUnit);
    if (matchingUnit) {
        return matchingUnit;
    }
    
    // If no matching unit, return the first available alternative
    return alternatives.length > 0 ? alternatives[0] : null;
};

/**
 * Check if all ingredients for a menu item are available in sufficient quantities
 * Also returns a mapping of which actual inventory items to use (including alternatives)
 * @param {Array} ingredients - Array of ingredient objects with ingredient ID, quantity, and unit
 * @param {Number} quantity - Number of dishes to make (default: 1)
 * @param {Boolean} returnItemMapping - If true, also return mapping of original to actual item IDs
 * @returns {Object} - { isAvailable: boolean, stockStatus: string, missingIngredients: Array, itemMapping?: Object }
 */
export const checkIngredientAvailability = async (ingredients, quantity = 1, returnItemMapping = false) => {
    const missingIngredients = [];
    let hasLowStock = false;
    let hasOutOfStock = false;
    const itemMapping = {}; // Maps original ingredient ID to actual item ID to use

    for (const ingredient of ingredients) {
        const originalIngredientId = typeof ingredient.ingredient === 'object' 
            ? ingredient.ingredient._id || ingredient.ingredient 
            : ingredient.ingredient;
        
        let inventoryItem = await InventoryItem.findById(originalIngredientId);
        let usedAlternative = false;
        let actualItemId = originalIngredientId;
        
        if (!inventoryItem) {
            missingIngredients.push({
                ingredient: originalIngredientId,
                name: 'Unknown Ingredient',
                required: ingredient.quantity * quantity,
                available: 0,
                unit: ingredient.unit,
                reason: 'Ingredient not found in inventory'
            });
            hasOutOfStock = true;
            continue;
        }

        const ingredientName = inventoryItem.name;
        const now = new Date();
        // Only check actual expiry date, not status field (status might be incorrectly set)
        const isExpired = inventoryItem.expiryDate && new Date(inventoryItem.expiryDate) < now;
        const requiredQuantity = ingredient.quantity * quantity;
        let availableQuantity = inventoryItem.currentStock;
        
        // Check if the original ingredient is expired or out of stock
        // Only use actual expiry date check, not status field
        if (isExpired || availableQuantity < requiredQuantity) {
            // Try to find an alternative available item with the same name
            const alternative = await findAlternativeIngredient(
                ingredientName,
                originalIngredientId,
                ingredient.unit
            );
            
            if (alternative) {
                // Use the alternative item
                inventoryItem = alternative;
                availableQuantity = alternative.currentStock;
                actualItemId = alternative._id.toString();
                usedAlternative = true;
                itemMapping[originalIngredientId.toString()] = actualItemId;
                console.log(`Using alternative ${ingredientName} item: ${actualItemId} instead of ${originalIngredientId}`);
            } else {
                // No alternative found, mark as unavailable
                if (isExpired) {
                    missingIngredients.push({
                        ingredient: originalIngredientId,
                        name: inventoryItem.name,
                        required: requiredQuantity,
                        available: 0,
                        unit: ingredient.unit,
                        reason: 'Ingredient expired (no alternatives available)'
                    });
                    hasOutOfStock = true;
                } else {
                    missingIngredients.push({
                        ingredient: originalIngredientId,
                        name: inventoryItem.name,
                        required: requiredQuantity,
                        available: availableQuantity,
                        unit: ingredient.unit,
                        reason: availableQuantity === 0 ? 'Out of stock (no alternatives available)' : 'Insufficient quantity (no alternatives available)'
                    });
                    
                    if (availableQuantity === 0) {
                        hasOutOfStock = true;
                    } else {
                        hasLowStock = true;
                    }
                }
                continue;
            }
        } else {
            // Original item is available, use it
            itemMapping[originalIngredientId.toString()] = actualItemId.toString();
        }

        // Check if we have sufficient quantity (either from original or alternative)
        if (availableQuantity < requiredQuantity) {
            missingIngredients.push({
                ingredient: actualItemId,
                name: inventoryItem.name,
                required: requiredQuantity,
                available: availableQuantity,
                unit: ingredient.unit,
                reason: availableQuantity === 0 ? 'Out of stock' : 'Insufficient quantity'
            });
            
            if (availableQuantity === 0) {
                hasOutOfStock = true;
            } else {
                hasLowStock = true;
            }
        } else if (inventoryItem.status === 'low_stock' || 
                   (inventoryItem.minThreshold > 0 && availableQuantity <= inventoryItem.minThreshold)) {
            hasLowStock = true;
        }
    }

    // Determine overall stock status
    let stockStatus = 'available';
    let isAvailable = true;

    if (hasOutOfStock || missingIngredients.length > 0) {
        stockStatus = 'out_of_stock';
        isAvailable = false;
    } else if (hasLowStock) {
        stockStatus = 'low_stock';
        isAvailable = true; // Still available but with low stock warning
    }

    const result = {
        isAvailable,
        stockStatus,
        missingIngredients
    };

    if (returnItemMapping) {
        result.itemMapping = itemMapping;
    }

    return result;
};

/**
 * Update menu item stock status based on ingredient availability
 * @param {String} menuItemId - ID of the menu item to update
 * @param {Number} quantity - Number of dishes to check for (default: 1)
 * @returns {Object} - Updated stock status information
 */
export const updateMenuItemStockStatus = async (menuItemId, quantity = 1) => {
    const { MenuItem } = await import("../models/menu/menuItem.model.js");
    
    const menuItem = await MenuItem.findById(menuItemId)
        .populate('ingredients.ingredient');
    
    if (!menuItem) {
        throw new Error('Menu item not found');
    }

    const stockCheck = await checkIngredientAvailability(menuItem.ingredients, quantity);
    
    // Update menu item with new stock status
    menuItem.isAvailable = stockCheck.isAvailable;
    menuItem.stockStatus = stockCheck.stockStatus;
    await menuItem.save();

    return {
        menuItem,
        stockCheck
    };
};

/**
 * Check and update stock status for multiple menu items
 * @param {Array} menuItemIds - Array of menu item IDs
 * @returns {Array} - Array of updated menu items with stock status
 */
export const updateMultipleMenuItemStockStatus = async (menuItemIds) => {
    const { MenuItem } = await import("../models/menu/menuItem.model.js");
    
    const results = [];
    
    for (const menuItemId of menuItemIds) {
        try {
            const result = await updateMenuItemStockStatus(menuItemId);
            results.push(result);
        } catch (error) {
            console.error(`Error updating stock status for menu item ${menuItemId}:`, error);
        }
    }
    
    return results;
};
