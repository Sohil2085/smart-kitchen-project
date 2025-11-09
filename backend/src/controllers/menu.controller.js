import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { MenuItem } from "../models/menu/menuItem.model.js";
import { RecipeRecommendation } from "../models/menu/recipeRecommendation.model.js";
import { InventoryItem } from "../models/inventory/inventoryItem.model.js";
import { checkIngredientAvailability, updateMenuItemStockStatus } from "../utils/stockChecker.js";

// Get all menu items
const getAllMenuItems = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    // Build filter object - filter by restaurant
    const filter = {
        restaurant: req.user.restaurant
    };
    
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await MenuItem.countDocuments(filter);

    // Get items with pagination and populate ingredients
    const menuItems = await MenuItem.find(filter)
        .populate({
            path: 'ingredients.ingredient',
            model: 'InventoryItem',
            select: 'name category unit currentStock status'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Check stock status for each menu item
    const menuItemsWithStockStatus = await Promise.all(
        menuItems.map(async (item) => {
            const stockCheck = await checkIngredientAvailability(item.ingredients, 1);
            
            // Update the menu item's stock status if it has changed
            if (item.stockStatus !== stockCheck.stockStatus || item.isAvailable !== stockCheck.isAvailable) {
                item.stockStatus = stockCheck.stockStatus;
                item.isAvailable = stockCheck.isAvailable;
                await item.save();
            }
            
            return {
                ...item.toObject(),
                stockInfo: {
                    isAvailable: stockCheck.isAvailable,
                    stockStatus: stockCheck.stockStatus,
                    missingIngredients: stockCheck.missingIngredients
                }
            };
        })
    );

    // Create pagination response object
    const paginatedResponse = {
        docs: menuItemsWithStockStatus,
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
        new apiResponse(200, paginatedResponse, "Menu items retrieved successfully")
    );
});

// Get menu item by ID
const getMenuItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({ 
        _id: id, 
        restaurant: req.user.restaurant 
    })
        .populate({
            path: 'ingredients.ingredient',
            model: 'InventoryItem',
            select: 'name category unit currentStock status'
        });

    if (!menuItem) {
        throw new apiError(404, "Menu item not found");
    }

    // Check stock status for the menu item
    const stockCheck = await checkIngredientAvailability(menuItem.ingredients, 1);
    
    // Update the menu item's stock status if it has changed
    if (menuItem.stockStatus !== stockCheck.stockStatus || menuItem.isAvailable !== stockCheck.isAvailable) {
        menuItem.stockStatus = stockCheck.stockStatus;
        menuItem.isAvailable = stockCheck.isAvailable;
        await menuItem.save();
    }

    const menuItemWithStockInfo = {
        ...menuItem.toObject(),
        stockInfo: {
            isAvailable: stockCheck.isAvailable,
            stockStatus: stockCheck.stockStatus,
            missingIngredients: stockCheck.missingIngredients
        }
    };

    return res.status(200).json(
        new apiResponse(200, menuItemWithStockInfo, "Menu item retrieved successfully")
    );
});

// Create new menu item
const createMenuItem = asyncHandler(async (req, res) => {
    const { name, description, ingredients, baseCost, suggestedPrice, imageUrl } = req.body;

    // Validate user authentication and restaurant
    if (!req.user || !req.user.restaurant) {
        throw new apiError(400, "User restaurant information is missing");
    }

    // Validate required fields
    if (!name || !ingredients || baseCost === undefined || baseCost === null || suggestedPrice === undefined || suggestedPrice === null) {
        throw new apiError(400, "Name, ingredients, base cost, and suggested price are required");
    }

    // Validate numeric fields
    if (isNaN(baseCost) || baseCost < 0) {
        throw new apiError(400, "Base cost must be a non-negative number");
    }

    if (isNaN(suggestedPrice) || suggestedPrice < 0) {
        throw new apiError(400, "Suggested price must be a non-negative number");
    }

    // Validate ingredients
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new apiError(400, "At least one ingredient is required");
    }

    // Validate each ingredient structure
    for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        if (!ing.ingredient) {
            throw new apiError(400, `Ingredient ${i + 1}: ingredient ID is required`);
        }
        if (!ing.quantity || isNaN(ing.quantity) || ing.quantity <= 0) {
            throw new apiError(400, `Ingredient ${i + 1}: quantity must be a positive number`);
        }
        if (!ing.unit || !['pcs', 'kg', 'ltr', 'g', 'ml', 'lb', 'oz'].includes(ing.unit)) {
            throw new apiError(400, `Ingredient ${i + 1}: unit must be one of: pcs, kg, ltr, g, ml, lb, oz`);
        }

        // Check if ingredient exists
        const ingredientExists = await InventoryItem.findById(ing.ingredient);
        if (!ingredientExists) {
            throw new apiError(400, `Ingredient ${i + 1}: Inventory item with ID ${ing.ingredient} not found`);
        }
    }

    // Calculate profit margin
    const profitMargin = ((suggestedPrice - baseCost) / baseCost) * 100;

    try {
        const menuItem = await MenuItem.create({
            name,
            description,
            ingredients,
            baseCost: Number(baseCost),
            suggestedPrice: Number(suggestedPrice),
            profitMargin,
            imageUrl,
            restaurant: req.user.restaurant
        });

        // Check initial stock status and update the menu item
        const stockCheck = await checkIngredientAvailability(ingredients, 1);
        menuItem.isAvailable = stockCheck.isAvailable;
        menuItem.stockStatus = stockCheck.stockStatus;
        await menuItem.save();

        // Populate the created item
        const populatedMenuItem = await MenuItem.findById(menuItem._id)
            .populate({
                path: 'ingredients.ingredient',
                model: 'InventoryItem',
                select: 'name category unit currentStock status'
            });

        const menuItemWithStockInfo = {
            ...populatedMenuItem.toObject(),
            stockInfo: {
                isAvailable: stockCheck.isAvailable,
                stockStatus: stockCheck.stockStatus,
                missingIngredients: stockCheck.missingIngredients
            }
        };

        return res.status(201).json(
            new apiResponse(201, menuItemWithStockInfo, "Menu item created successfully")
        );
    } catch (error) {
        console.error('Error creating menu item:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => {
                return `${err.path}: ${err.message}`;
            }).join(', ');
            throw new apiError(400, `Validation Error: ${validationErrors}`);
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            throw new apiError(400, `${field} already exists`);
        }
        
        // Re-throw apiError instances as-is
        if (error instanceof apiError) {
            throw error;
        }
        
        // Handle other errors
        throw new apiError(500, error.message || 'Failed to create menu item');
    }
});

// Update menu item
const updateMenuItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // If ingredients are being updated, validate them
    if (updateData.ingredients) {
        if (!Array.isArray(updateData.ingredients) || updateData.ingredients.length === 0) {
            throw new apiError(400, "At least one ingredient is required");
        }

        // Check if all ingredients exist
        for (const ing of updateData.ingredients) {
            const ingredientExists = await InventoryItem.findById(ing.ingredient);
            if (!ingredientExists) {
                throw new apiError(400, `Ingredient with ID ${ing.ingredient} not found`);
            }
        }
    }

    // Recalculate profit margin if cost or price is updated
    if (updateData.baseCost || updateData.suggestedPrice) {
        const currentItem = await MenuItem.findById(id);
        if (currentItem) {
            const newBaseCost = updateData.baseCost || currentItem.baseCost;
            const newSuggestedPrice = updateData.suggestedPrice || currentItem.suggestedPrice;
            updateData.profitMargin = ((newSuggestedPrice - newBaseCost) / newBaseCost) * 100;
        }
    }

    const menuItem = await MenuItem.findOneAndUpdate(
        { _id: id, restaurant: req.user.restaurant },
        updateData,
        { new: true, runValidators: true }
    ).populate({
        path: 'ingredients.ingredient',
        model: 'InventoryItem',
        select: 'name category unit'
    });

    if (!menuItem) {
        throw new apiError(404, "Menu item not found");
    }

    return res.status(200).json(
        new apiResponse(200, menuItem, "Menu item updated successfully")
    );
});

// Delete menu item
const deleteMenuItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const menuItem = await MenuItem.findOneAndDelete({ 
        _id: id, 
        restaurant: req.user.restaurant 
    });

    if (!menuItem) {
        throw new apiError(404, "Menu item not found");
    }

    return res.status(200).json(
        new apiResponse(200, null, "Menu item deleted successfully")
    );
});

// Get all recipe recommendations
const getAllRecipeRecommendations = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
        filter.generatedRecipeName = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination info
    const total = await RecipeRecommendation.countDocuments(filter);

    // Get items with pagination and populate ingredients
    const recipes = await RecipeRecommendation.find(filter)
        .populate({
            path: 'usedIngredients.ingredient',
            model: 'InventoryItem',
            select: 'name category unit currentStock'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Create pagination response object
    const paginatedResponse = {
        docs: recipes,
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
        new apiResponse(200, paginatedResponse, "Recipe recommendations retrieved successfully")
    );
});

// Create new recipe recommendation
const createRecipeRecommendation = asyncHandler(async (req, res) => {
    const { generatedRecipeName, usedIngredients, instructions, notes } = req.body;

    // Validate required fields
    if (!generatedRecipeName || !usedIngredients || !instructions) {
        throw new apiError(400, "Recipe name, ingredients, and instructions are required");
    }

    // Validate ingredients
    if (!Array.isArray(usedIngredients) || usedIngredients.length === 0) {
        throw new apiError(400, "At least one ingredient is required");
    }

    // Check if all ingredients exist
    for (const ing of usedIngredients) {
        const ingredientExists = await InventoryItem.findById(ing.ingredient);
        if (!ingredientExists) {
            throw new apiError(400, `Ingredient with ID ${ing.ingredient} not found`);
        }
    }

    const recipe = await RecipeRecommendation.create({
        generatedRecipeName,
        usedIngredients,
        instructions,
        notes
    });

    // Populate the created recipe
    const populatedRecipe = await RecipeRecommendation.findById(recipe._id)
        .populate({
            path: 'usedIngredients.ingredient',
            model: 'InventoryItem',
            select: 'name category unit currentStock'
        });

    return res.status(201).json(
        new apiResponse(201, populatedRecipe, "Recipe recommendation created successfully")
    );
});

// Get available ingredients for menu/recipe creation
const getAvailableIngredients = asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    const now = new Date();
    
    // Build filter object - exclude expired items and items with no stock
    const filter = {
        currentStock: { $gt: 0 }, // Only ingredients with stock > 0
        status: { $ne: 'expired' }, // Exclude items marked as expired
        $or: [
            { expiryDate: { $exists: false } }, // Items without expiry date
            { expiryDate: { $gte: now } } // Items that haven't expired yet
        ]
    };
    
    if (category) {
        filter.category = category;
    }
    
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    const ingredients = await InventoryItem.find(filter)
        .select('name category unit currentStock expiryDate status')
        .sort({ name: 1 });

    return res.status(200).json(
        new apiResponse(200, ingredients, "Available ingredients retrieved successfully")
    );
});

// Check stock status for a specific menu item
const checkMenuItemStockStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const menuItem = await MenuItem.findOne({ 
        _id: id, 
        restaurant: req.user.restaurant 
    })
        .populate({
            path: 'ingredients.ingredient',
            model: 'InventoryItem',
            select: 'name category unit currentStock status'
        });

    if (!menuItem) {
        throw new apiError(404, "Menu item not found");
    }

    const stockCheck = await checkIngredientAvailability(menuItem.ingredients, parseInt(quantity));
    
    // Update the menu item's stock status if it has changed
    if (menuItem.stockStatus !== stockCheck.stockStatus || menuItem.isAvailable !== stockCheck.isAvailable) {
        menuItem.stockStatus = stockCheck.stockStatus;
        menuItem.isAvailable = stockCheck.isAvailable;
        await menuItem.save();
    }

    return res.status(200).json(
        new apiResponse(200, {
            menuItemId: id,
            quantity: parseInt(quantity),
            stockInfo: stockCheck
        }, "Stock status checked successfully")
    );
});

// Update stock status for all menu items
const updateAllMenuItemsStockStatus = asyncHandler(async (req, res) => {
    const menuItems = await MenuItem.find({ restaurant: req.user.restaurant });
    
    const results = await Promise.all(
        menuItems.map(async (item) => {
            try {
                const stockCheck = await checkIngredientAvailability(item.ingredients, 1);
                
                if (item.stockStatus !== stockCheck.stockStatus || item.isAvailable !== stockCheck.isAvailable) {
                    item.stockStatus = stockCheck.stockStatus;
                    item.isAvailable = stockCheck.isAvailable;
                    await item.save();
                }
                
                return {
                    menuItemId: item._id,
                    name: item.name,
                    stockStatus: stockCheck.stockStatus,
                    isAvailable: stockCheck.isAvailable
                };
            } catch (error) {
                console.error(`Error updating stock for menu item ${item._id}:`, error);
                return {
                    menuItemId: item._id,
                    name: item.name,
                    error: error.message
                };
            }
        })
    );

    return res.status(200).json(
        new apiResponse(200, {
            updatedItems: results.filter(r => !r.error).length,
            totalItems: results.length,
            results
        }, "Stock status updated for all menu items")
    );
});

export {
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
};
