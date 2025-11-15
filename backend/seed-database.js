#!/usr/bin/env node

/**
 * Database Seeding Script for Smart Kitchen
 * This script populates the database with dummy data for testing and development
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

// Import models
import { User } from "./src/models/auth/user.model.js";
import { InventoryItem } from "./src/models/inventory/inventoryItem.model.js";
import { MenuItem } from "./src/models/menu/menuItem.model.js";
import { Order } from "./src/models/order/order.model.js";
import { Sales } from "./src/models/demand/salesData.model.js";
import { WasteLog } from "./src/models/waste/wasteLog.model.js";
import { DailyInventoryEntry } from "./src/models/inventory/dailyInventoryEntry.model.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-kitchen";
        
        if (!mongoUri) {
            throw new Error("MONGODB_URI environment variable is required.");
        }
        
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB Connected Successfully!");
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

// Clear existing data
const clearDatabase = async () => {
    try {
        console.log("\n🗑️  Clearing existing data...");
        await User.deleteMany({});
        await InventoryItem.deleteMany({});
        await MenuItem.deleteMany({});
        await Order.deleteMany({});
        await Sales.deleteMany({});
        await WasteLog.deleteMany({});
        await DailyInventoryEntry.deleteMany({});
        console.log("✅ Database cleared successfully!");
    } catch (error) {
        console.error("❌ Error clearing database:", error.message);
        throw error;
    }
};

// Create dummy users
const createUsers = async () => {
    try {
        console.log("\n👥 Creating users...");
        
        const users = [
            {
                username: "admin",
                email: "admin@smartkitchen.com",
                fullname: "Admin User",
                password: "admin123",
                role: "admin",
                avatar: "https://via.placeholder.com/150",
                restaurant: "restaurant1"
            },
            {
                username: "chef1",
                email: "chef1@smartkitchen.com",
                fullname: "Master Chef",
                password: "chef123",
                role: "chef",
                avatar: "https://via.placeholder.com/150",
                restaurant: "restaurant1"
            },
            {
                username: "employee1",
                email: "employee1@smartkitchen.com",
                fullname: "John Employee",
                password: "emp123",
                role: "employee",
                avatar: "https://via.placeholder.com/150",
                restaurant: "restaurant1"
            },
            {
                username: "employee2",
                email: "employee2@smartkitchen.com",
                fullname: "Jane Employee",
                password: "emp123",
                role: "employee",
                avatar: "https://via.placeholder.com/150",
                restaurant: "restaurant1"
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users`);
        return createdUsers;
    } catch (error) {
        console.error("❌ Error creating users:", error.message);
        throw error;
    }
};

// Create dummy inventory items
const createInventoryItems = async (users) => {
    try {
        console.log("\n📦 Creating inventory items...");
        
        const adminUser = users.find(u => u.role === "admin");
        const inventoryData = [
            // Vegetables
            { name: "Tomatoes", quantity: 50, currentStock: 50, unit: "kg", category: "vegetables", storageCondition: "fridge", cost: 80, minThreshold: 10, supplier: "Fresh Farm Co." },
            { name: "Onions", quantity: 30, currentStock: 30, unit: "kg", category: "vegetables", storageCondition: "room_temperature", cost: 40, minThreshold: 5, supplier: "Fresh Farm Co." },
            { name: "Potatoes", quantity: 40, currentStock: 40, unit: "kg", category: "vegetables", storageCondition: "room_temperature", cost: 50, minThreshold: 10, supplier: "Fresh Farm Co." },
            { name: "Carrots", quantity: 25, currentStock: 25, unit: "kg", category: "vegetables", storageCondition: "fridge", cost: 60, minThreshold: 5, supplier: "Fresh Farm Co." },
            { name: "Bell Peppers", quantity: 15, currentStock: 15, unit: "kg", category: "vegetables", storageCondition: "fridge", cost: 120, minThreshold: 3, supplier: "Fresh Farm Co." },
            
            // Fruits
            { name: "Apples", quantity: 20, currentStock: 20, unit: "kg", category: "fruits", storageCondition: "fridge", cost: 100, minThreshold: 5, supplier: "Fruit Paradise" },
            { name: "Bananas", quantity: 15, currentStock: 15, unit: "kg", category: "fruits", storageCondition: "room_temperature", cost: 60, minThreshold: 3, supplier: "Fruit Paradise" },
            { name: "Oranges", quantity: 18, currentStock: 18, unit: "kg", category: "fruits", storageCondition: "room_temperature", cost: 80, minThreshold: 5, supplier: "Fruit Paradise" },
            
            // Dairy
            { name: "Milk", quantity: 20, currentStock: 20, unit: "ltr", category: "dairy", storageCondition: "fridge", cost: 60, minThreshold: 5, supplier: "Dairy Fresh" },
            { name: "Cheese", quantity: 10, currentStock: 10, unit: "kg", category: "dairy", storageCondition: "fridge", cost: 400, minThreshold: 2, supplier: "Dairy Fresh" },
            { name: "Butter", quantity: 5, currentStock: 5, unit: "kg", category: "dairy", storageCondition: "fridge", cost: 500, minThreshold: 1, supplier: "Dairy Fresh" },
            { name: "Yogurt", quantity: 15, currentStock: 15, unit: "kg", category: "dairy", storageCondition: "fridge", cost: 80, minThreshold: 3, supplier: "Dairy Fresh" },
            
            // Meat
            { name: "Chicken", quantity: 25, currentStock: 25, unit: "kg", category: "meat", storageCondition: "freezer", cost: 300, minThreshold: 5, supplier: "Meat Masters" },
            { name: "Beef", quantity: 15, currentStock: 15, unit: "kg", category: "meat", storageCondition: "freezer", cost: 600, minThreshold: 3, supplier: "Meat Masters" },
            { name: "Pork", quantity: 12, currentStock: 12, unit: "kg", category: "meat", storageCondition: "freezer", cost: 450, minThreshold: 2, supplier: "Meat Masters" },
            
            // Grains
            { name: "Rice", quantity: 50, currentStock: 50, unit: "kg", category: "grains", storageCondition: "dry_storage", cost: 80, minThreshold: 10, supplier: "Grain Co." },
            { name: "Wheat Flour", quantity: 30, currentStock: 30, unit: "kg", category: "grains", storageCondition: "dry_storage", cost: 60, minThreshold: 5, supplier: "Grain Co." },
            { name: "Pasta", quantity: 20, currentStock: 20, unit: "kg", category: "grains", storageCondition: "dry_storage", cost: 100, minThreshold: 5, supplier: "Grain Co." },
            
            // Spices
            { name: "Salt", quantity: 10, currentStock: 10, unit: "kg", category: "spices", storageCondition: "dry_storage", cost: 20, minThreshold: 2, supplier: "Spice World" },
            { name: "Black Pepper", quantity: 2, currentStock: 2, unit: "kg", category: "spices", storageCondition: "dry_storage", cost: 500, minThreshold: 0.5, supplier: "Spice World" },
            { name: "Turmeric", quantity: 3, currentStock: 3, unit: "kg", category: "spices", storageCondition: "dry_storage", cost: 300, minThreshold: 0.5, supplier: "Spice World" },
            
            // Beverages
            { name: "Cooking Oil", quantity: 15, currentStock: 15, unit: "ltr", category: "beverages", storageCondition: "room_temperature", cost: 150, minThreshold: 3, supplier: "Oil Co." },
            { name: "Vinegar", quantity: 10, currentStock: 10, unit: "ltr", category: "beverages", storageCondition: "room_temperature", cost: 80, minThreshold: 2, supplier: "Oil Co." },
            
            // Low stock items
            { name: "Garlic", quantity: 2, currentStock: 2, unit: "kg", category: "vegetables", storageCondition: "room_temperature", cost: 200, minThreshold: 3, supplier: "Fresh Farm Co." },
            { name: "Ginger", quantity: 1, currentStock: 1, unit: "kg", category: "vegetables", storageCondition: "room_temperature", cost: 300, minThreshold: 2, supplier: "Fresh Farm Co." }
        ];

        // Add expiry dates (some items expiring soon, some later)
        const now = new Date();
        const inventoryItems = inventoryData.map((item, index) => {
            const expiryDate = new Date(now);
            if (item.category === "dairy" || item.category === "meat") {
                expiryDate.setDate(expiryDate.getDate() + 7); // 7 days for dairy/meat
            } else if (item.category === "fruits" || item.category === "vegetables") {
                expiryDate.setDate(expiryDate.getDate() + 5); // 5 days for fresh produce
            } else {
                expiryDate.setDate(expiryDate.getDate() + 30); // 30 days for others
            }
            
            return {
                ...item,
                addedBy: adminUser._id,
                expiryDate: expiryDate,
                addedDate: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)) // Staggered dates
            };
        });

        const createdItems = await InventoryItem.insertMany(inventoryItems);
        console.log(`✅ Created ${createdItems.length} inventory items`);
        return createdItems;
    } catch (error) {
        console.error("❌ Error creating inventory items:", error.message);
        throw error;
    }
};

// Create dummy menu items
const createMenuItems = async (inventoryItems) => {
    try {
        console.log("\n🍽️  Creating menu items...");
        
        const getItemByName = (name) => inventoryItems.find(item => item.name === name);
        
        const menuData = [
            {
                name: "Chicken Curry",
                description: "Spicy chicken curry with aromatic spices",
                ingredients: [
                    { ingredient: getItemByName("Chicken")._id, quantity: 0.5, unit: "kg" },
                    { ingredient: getItemByName("Onions")._id, quantity: 0.2, unit: "kg" },
                    { ingredient: getItemByName("Tomatoes")._id, quantity: 0.3, unit: "kg" },
                    { ingredient: getItemByName("Cooking Oil")._id, quantity: 0.05, unit: "ltr" },
                    { ingredient: getItemByName("Turmeric")._id, quantity: 0.01, unit: "kg" }
                ],
                baseCost: 180,
                suggestedPrice: 350,
                profitMargin: 48.6,
                imageUrl: "https://via.placeholder.com/300",
                restaurant: "restaurant1",
                isAvailable: true
            },
            {
                name: "Vegetable Pasta",
                description: "Fresh pasta with mixed vegetables",
                ingredients: [
                    { ingredient: getItemByName("Pasta")._id, quantity: 0.3, unit: "kg" },
                    { ingredient: getItemByName("Bell Peppers")._id, quantity: 0.2, unit: "kg" },
                    { ingredient: getItemByName("Carrots")._id, quantity: 0.15, unit: "kg" },
                    { ingredient: getItemByName("Cheese")._id, quantity: 0.1, unit: "kg" },
                    { ingredient: getItemByName("Cooking Oil")._id, quantity: 0.03, unit: "ltr" }
                ],
                baseCost: 120,
                suggestedPrice: 250,
                profitMargin: 52.0,
                imageUrl: "https://via.placeholder.com/300",
                restaurant: "restaurant1",
                isAvailable: true
            },
            {
                name: "Beef Steak",
                description: "Grilled beef steak with vegetables",
                ingredients: [
                    { ingredient: getItemByName("Beef")._id, quantity: 0.3, unit: "kg" },
                    { ingredient: getItemByName("Potatoes")._id, quantity: 0.2, unit: "kg" },
                    { ingredient: getItemByName("Bell Peppers")._id, quantity: 0.1, unit: "kg" },
                    { ingredient: getItemByName("Butter")._id, quantity: 0.05, unit: "kg" },
                    { ingredient: getItemByName("Black Pepper")._id, quantity: 0.01, unit: "kg" }
                ],
                baseCost: 250,
                suggestedPrice: 550,
                profitMargin: 54.5,
                imageUrl: "https://via.placeholder.com/300",
                restaurant: "restaurant1",
                isAvailable: true
            },
            {
                name: "Fresh Fruit Salad",
                description: "Mixed fresh fruits with yogurt",
                ingredients: [
                    { ingredient: getItemByName("Apples")._id, quantity: 0.2, unit: "kg" },
                    { ingredient: getItemByName("Bananas")._id, quantity: 0.15, unit: "kg" },
                    { ingredient: getItemByName("Oranges")._id, quantity: 0.15, unit: "kg" },
                    { ingredient: getItemByName("Yogurt")._id, quantity: 0.1, unit: "kg" }
                ],
                baseCost: 80,
                suggestedPrice: 180,
                profitMargin: 55.6,
                imageUrl: "https://via.placeholder.com/300",
                restaurant: "restaurant1",
                isAvailable: true
            },
            {
                name: "Fried Rice",
                description: "Classic fried rice with vegetables",
                ingredients: [
                    { ingredient: getItemByName("Rice")._id, quantity: 0.3, unit: "kg" },
                    { ingredient: getItemByName("Carrots")._id, quantity: 0.1, unit: "kg" },
                    { ingredient: getItemByName("Onions")._id, quantity: 0.1, unit: "kg" },
                    { ingredient: getItemByName("Cooking Oil")._id, quantity: 0.05, unit: "ltr" },
                    { ingredient: getItemByName("Salt")._id, quantity: 0.01, unit: "kg" }
                ],
                baseCost: 60,
                suggestedPrice: 150,
                profitMargin: 60.0,
                imageUrl: "https://via.placeholder.com/300",
                restaurant: "restaurant1",
                isAvailable: true
            }
        ];

        const createdMenuItems = await MenuItem.insertMany(menuData);
        console.log(`✅ Created ${createdMenuItems.length} menu items`);
        return createdMenuItems;
    } catch (error) {
        console.error("❌ Error creating menu items:", error.message);
        throw error;
    }
};

// Create dummy orders
const createOrders = async (users, menuItems) => {
    try {
        console.log("\n📋 Creating orders...");
        
        const employee = users.find(u => u.role === "employee");
        const orders = [];
        const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        const orderTypes = ['dine-in', 'takeaway', 'delivery'];
        
        // Get current count to generate unique order numbers
        const existingOrderCount = await Order.countDocuments();
        
        // Create orders for the last 30 days
        for (let i = 0; i < 50; i++) {
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
            
            const selectedMenuItems = menuItems.slice(0, Math.floor(Math.random() * 3) + 1);
            const items = selectedMenuItems.map(menuItem => {
                const quantity = Math.floor(Math.random() * 3) + 1;
                return {
                    menuItem: menuItem._id,
                    quantity: quantity,
                    unitPrice: menuItem.suggestedPrice,
                    totalPrice: menuItem.suggestedPrice * quantity
                };
            });
            
            const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
            const tax = subtotal * 0.1; // 10% tax
            const discount = Math.random() > 0.7 ? subtotal * 0.1 : 0; // 30% chance of discount
            const totalAmount = subtotal + tax - discount;
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
            
            // Generate unique order number manually
            const orderNumber = `ORD-${String(existingOrderCount + i + 1).padStart(4, '0')}`;
            
            orders.push({
                orderNumber: orderNumber,
                customerName: `Customer ${i + 1}`,
                customerPhone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                customerEmail: `customer${i + 1}@example.com`,
                items: items,
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                totalAmount: totalAmount,
                status: status,
                orderType: orderType,
                createdBy: employee._id,
                restaurant: "restaurant1",
                createdAt: orderDate,
                updatedAt: orderDate
            });
        }
        
        const createdOrders = await Order.insertMany(orders);
        console.log(`✅ Created ${createdOrders.length} orders`);
        return createdOrders;
    } catch (error) {
        console.error("❌ Error creating orders:", error.message);
        throw error;
    }
};

// Create dummy sales data
const createSalesData = async (menuItems) => {
    try {
        console.log("\n💰 Creating sales data...");
        
        const sales = [];
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const seasons = ["Spring", "Summer", "Monsoon", "Autumn", "Winter"];
        const specialEvents = ["Reguler", "Festival", "Holiday", "Promotion"];
        
        // Create sales data for the last 60 days
        for (let i = 0; i < 60; i++) {
            const saleDate = new Date();
            saleDate.setDate(saleDate.getDate() - (60 - i));
            
            // Create sales for each menu item
            for (const menuItem of menuItems) {
                const quantitySold = Math.floor(Math.random() * 20) + 1;
                const dayOfWeek = daysOfWeek[saleDate.getDay()];
                const season = seasons[Math.floor(Math.random() * seasons.length)];
                const specialEvent = specialEvents[Math.floor(Math.random() * specialEvents.length)];
                
                sales.push({
                    product: menuItem._id,
                    quantitySold: quantitySold,
                    saleDate: saleDate,
                    dayOfWeek: dayOfWeek,
                    season: season,
                    specialEvent: specialEvent
                });
            }
        }
        
        const createdSales = await Sales.insertMany(sales);
        console.log(`✅ Created ${createdSales.length} sales records`);
        return createdSales;
    } catch (error) {
        console.error("❌ Error creating sales data:", error.message);
        throw error;
    }
};

// Create dummy waste logs
const createWasteLogs = async (users, inventoryItems) => {
    try {
        console.log("\n🗑️  Creating waste logs...");
        
        const employee = users.find(u => u.role === "employee");
        const categories = ['spoiled', 'over-portioning', 'expired', 'burnt', 'other'];
        const wasteLogs = [];
        
        // Create waste logs for the last 30 days
        for (let i = 0; i < 30; i++) {
            const wasteDate = new Date();
            wasteDate.setDate(wasteDate.getDate() - (30 - i));
            
            // Create 1-3 waste logs per day
            const logsPerDay = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < logsPerDay; j++) {
                const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const quantity = Math.random() * 2 + 0.1; // Random quantity between 0.1 and 2.1
                
                wasteLogs.push({
                    ingredient: item._id,
                    category: category,
                    quantity: parseFloat(quantity.toFixed(2)),
                    unit: item.unit,
                    loggedBy: employee._id,
                    loggedAt: wasteDate,
                    notes: `Waste logged due to ${category}`
                });
            }
        }
        
        const createdWasteLogs = await WasteLog.insertMany(wasteLogs);
        console.log(`✅ Created ${createdWasteLogs.length} waste logs`);
        return createdWasteLogs;
    } catch (error) {
        console.error("❌ Error creating waste logs:", error.message);
        throw error;
    }
};

// Create dummy daily inventory entries
const createDailyInventoryEntries = async (users, inventoryItems) => {
    try {
        console.log("\n📅 Creating daily inventory entries...");
        
        const adminUser = users.find(u => u.role === "admin");
        const entries = [];
        
        // Create entries for the last 30 days
        for (let i = 0; i < 30; i++) {
            const entryDate = new Date();
            entryDate.setDate(entryDate.getDate() - (30 - i));
            entryDate.setHours(0, 0, 0, 0);
            
            // Create entries for random items each day
            const itemsForDay = inventoryItems.slice(0, Math.floor(Math.random() * 10) + 5);
            
            for (const item of itemsForDay) {
                const quantity = Math.floor(Math.random() * 20) + 5;
                const cost = item.cost || 0;
                
                entries.push({
                    date: entryDate,
                    inventoryItem: item._id,
                    quantity: quantity,
                    cost: cost,
                    expiryDate: item.expiryDate,
                    remainingQuantity: quantity,
                    addedBy: adminUser._id
                });
            }
        }
        
        const createdEntries = await DailyInventoryEntry.insertMany(entries);
        console.log(`✅ Created ${createdEntries.length} daily inventory entries`);
        return createdEntries;
    } catch (error) {
        console.error("❌ Error creating daily inventory entries:", error.message);
        throw error;
    }
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log("\n🌱 Starting database seeding...\n");
        
        await connectDB();
        await clearDatabase();
        
        const users = await createUsers();
        const inventoryItems = await createInventoryItems(users);
        const menuItems = await createMenuItems(inventoryItems);
        const orders = await createOrders(users, menuItems);
        const sales = await createSalesData(menuItems);
        const wasteLogs = await createWasteLogs(users, inventoryItems);
        const dailyEntries = await createDailyInventoryEntries(users, inventoryItems);
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ Database seeding completed successfully!");
        console.log("=".repeat(60));
        console.log(`📊 Summary:`);
        console.log(`   👥 Users: ${users.length}`);
        console.log(`   📦 Inventory Items: ${inventoryItems.length}`);
        console.log(`   🍽️  Menu Items: ${menuItems.length}`);
        console.log(`   📋 Orders: ${orders.length}`);
        console.log(`   💰 Sales Records: ${sales.length}`);
        console.log(`   🗑️  Waste Logs: ${wasteLogs.length}`);
        console.log(`   📅 Daily Inventory Entries: ${dailyEntries.length}`);
        console.log("=".repeat(60));
        console.log("\n💡 Test Credentials:");
        console.log("   Admin: admin / admin123");
        console.log("   Chef: chef1 / chef123");
        console.log("   Employee: employee1 / emp123");
        console.log("\n");
        
    } catch (error) {
        console.error("\n❌ Error seeding database:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
        process.exit(0);
    }
};

// Run the seeding
seedDatabase();

