import mongoose, { Schema } from "mongoose";

// Daily Inventory Entry Schema
// IMPORTANT: This is a TRACKING/LOG entry, NOT a separate stock system.
// The actual stock is stored in InventoryItem.currentStock (single source of truth).
// This schema tracks:
// - What was added to daily inventory on a specific date
// - What's remaining from that day's additions (for FIFO tracking)
// - Cost and expiry date for that specific batch
const dailyInventoryEntrySchema = new Schema({
    date: {
        type: Date,
        required: [true, "Date is required"],
        index: true
    },
    inventoryItem: {
        type: Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: [true, "Inventory item reference is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [0, "Quantity cannot be negative"]
        // Quantity added on this date
    },
    cost: {
        type: Number,
        required: false,
        min: [0, "Cost cannot be negative"]
        // Cost per unit for this batch
    },
    expiryDate: {
        type: Date,
        required: false
        // Expiry date for this specific batch
    },
    remainingQuantity: {
        type: Number,
        required: true,
        min: [0, "Remaining quantity cannot be negative"],
        default: function() { return this.quantity; }
        // TRACKING ONLY: For FIFO tracking (not actual stock)
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// Compound index for date and inventory item
dailyInventoryEntrySchema.index({ date: 1, inventoryItem: 1 });

// Index for date queries
dailyInventoryEntrySchema.index({ date: -1 });

export const DailyInventoryEntry = mongoose.model("DailyInventoryEntry", dailyInventoryEntrySchema);

