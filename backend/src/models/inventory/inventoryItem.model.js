import mongoose, { Schema } from "mongoose";

const inventoryItemSchema = new Schema({
    name: {
        type: String,
        required: [true, "Item name is required"],
        trim: true,
        index: true
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [0, "Quantity cannot be negative"]
        // Note: Initial quantity when item was first created (historical reference)
    },
    currentStock: {
        type: Number,
        required: [true, "Current stock is required"],
        min: [0, "Current stock cannot be negative"],
        default: function() { return this.quantity; }
        // IMPORTANT: SINGLE SOURCE OF TRUTH for available stock
    },
    unit: {
        type: String,
        required: [true, "Unit is required"],
        enum: ['pcs', 'kg', 'ltr', 'g', 'ml', 'lb', 'oz'],
        default: 'pcs'
    },
    addedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    expiryDate: {
        type: Date,
        required: false
    },
    storageCondition: {
        type: String,
        required: [true, "Storage condition is required"],
        enum: ['fridge', 'freezer', 'normal_temperature', 'room_temperature', 'pantry', 'dry_storage'],
        default: 'normal_temperature'
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: ['vegetables', 'fruits', 'dairy', 'meat', 'seafood', 'grains', 'spices', 'beverages', 'frozen', 'canned', 'other'],
        default: 'other'
    },
    supplier: {
        type: String,
        required: false,
        trim: true
    },
    cost: {
        type: Number,
        required: false,
        min: [0, "Cost cannot be negative"]
    },
    minThreshold: {
        type: Number,
        required: false,
        min: [0, "Minimum threshold cannot be negative"],
        default: 0
    },
    maxThreshold: {
        type: Number,
        required: false,
        min: [0, "Maximum threshold cannot be negative"]
    },
    status: {
        type: String,
        enum: ['active', 'low_stock', 'out_of_stock', 'expired', 'discontinued'],
        default: 'active'
    },
    notes: {
        type: String,
        required: false,
        trim: true
    },
    image: {
        type: String, // Cloudinary URL
        required: false
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, { timestamps: true });

// Index for better query performance
inventoryItemSchema.index({ name: 1, category: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ expiryDate: 1 });

// Virtual for checking if item is low stock
inventoryItemSchema.virtual('isLowStock').get(function() {
    return this.minThreshold > 0 && this.currentStock <= this.minThreshold;
});

// Virtual for checking if item is expired
inventoryItemSchema.virtual('isExpired').get(function() {
    return this.expiryDate && new Date() > this.expiryDate;
});

// Method to update status based on currentStock and expiry
inventoryItemSchema.methods.updateStatus = function() {
    if (this.currentStock === 0) {
        this.status = 'out_of_stock';
    } else if (this.isExpired) {
        this.status = 'expired';
    } else if (this.isLowStock) {
        this.status = 'low_stock';
    } else {
        this.status = 'active';
    }
    return this.status;
};

// Pre-save middleware to update status
inventoryItemSchema.pre('save', function(next) {
    this.updateStatus();
    next();
});

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
