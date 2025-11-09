import { updateMultipleMenuItemStockStatus } from "../utils/stockChecker.js";
import { MenuItem } from "../models/menu/menuItem.model.js";

/**
 * Middleware to automatically update menu item stock status when inventory changes
 * This should be called after inventory updates to keep menu items in sync
 */
export const updateMenuStockStatus = async (req, res, next) => {
    try {
        // Get all menu items for the restaurant
        const menuItems = await MenuItem.find({ restaurant: req.user.restaurant });
        const menuItemIds = menuItems.map(item => item._id);
        
        if (menuItemIds.length > 0) {
            // Update stock status for all menu items
            await updateMultipleMenuItemStockStatus(menuItemIds);
        }
        
        next();
    } catch (error) {
        console.error('Error updating menu stock status:', error);
        // Don't fail the request if stock update fails
        next();
    }
};

/**
 * Middleware to update stock status after inventory operations
 * This can be used as a post-operation hook
 */
export const postInventoryUpdate = async (req, res, next) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json to add stock update after response
    res.json = function(data) {
        // Call the original json method
        originalJson.call(this, data);
        
        // Update stock status asynchronously (don't wait for it)
        updateMenuStockStatus(req, res, () => {}).catch(error => {
            console.error('Background stock update failed:', error);
        });
    };
    
    next();
};
