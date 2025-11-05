/**
 * Simple test script to verify stock checking logic
 * Run this with: node test-stock-logic.js
 */

import mongoose from 'mongoose';
import { InventoryItem } from './src/models/inventory/inventoryItem.model.js';
import { MenuItem } from './src/models/menu/menuItem.model.js';
import { checkIngredientAvailability } from './src/utils/stockChecker.js';

// Test data
const testData = {
    ingredients: [
        {
            ingredient: null, // Will be set after creating inventory items
            quantity: 2,
            unit: 'kg'
        },
        {
            ingredient: null, // Will be set after creating inventory items
            quantity: 1,
            unit: 'pcs'
        }
    ]
};

async function testStockLogic() {
    try {
        // Connect to MongoDB (adjust connection string as needed)
        await mongoose.connect('mongodb://localhost:27017/smart-kitchen', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Create test inventory items
        const ingredient1 = await InventoryItem.create({
            name: 'Test Ingredient 1',
            quantity: 5,
            currentStock: 5,
            unit: 'kg',
            category: 'vegetables',
            storageCondition: 'normal_temperature',
            addedBy: new mongoose.Types.ObjectId(),
            restaurant: 'test-restaurant'
        });
        
        const ingredient2 = await InventoryItem.create({
            name: 'Test Ingredient 2',
            quantity: 3,
            currentStock: 3,
            unit: 'pcs',
            category: 'fruits',
            storageCondition: 'normal_temperature',
            addedBy: new mongoose.Types.ObjectId(),
            restaurant: 'test-restaurant'
        });
        
        console.log('Created test inventory items');
        
        // Test 1: Sufficient stock
        testData.ingredients[0].ingredient = ingredient1._id;
        testData.ingredients[1].ingredient = ingredient2._id;
        
        const stockCheck1 = await checkIngredientAvailability(testData.ingredients, 1);
        console.log('Test 1 - Sufficient stock:', stockCheck1);
        
        // Test 2: Insufficient stock (request 3 dishes)
        const stockCheck2 = await checkIngredientAvailability(testData.ingredients, 3);
        console.log('Test 2 - Insufficient stock (3 dishes):', stockCheck2);
        
        // Test 3: Out of stock (set currentStock to 0)
        await InventoryItem.findByIdAndUpdate(ingredient1._id, { currentStock: 0 });
        const stockCheck3 = await checkIngredientAvailability(testData.ingredients, 1);
        console.log('Test 3 - Out of stock:', stockCheck3);
        
        // Test 4: Create a menu item and test stock status
        const menuItem = await MenuItem.create({
            name: 'Test Dish',
            description: 'A test dish',
            ingredients: testData.ingredients,
            baseCost: 10,
            suggestedPrice: 15,
            restaurant: 'test-restaurant'
        });
        
        console.log('Created test menu item');
        
        // Restore stock for final test
        await InventoryItem.findByIdAndUpdate(ingredient1._id, { currentStock: 5 });
        
        // Test menu item stock status
        const menuItemStockCheck = await checkIngredientAvailability(menuItem.ingredients, 1);
        console.log('Menu item stock check:', menuItemStockCheck);
        
        // Cleanup
        await InventoryItem.deleteMany({ restaurant: 'test-restaurant' });
        await MenuItem.deleteMany({ restaurant: 'test-restaurant' });
        
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the test
testStockLogic();
