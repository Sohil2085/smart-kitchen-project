import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: String,
    customerEmail: String,
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        }
    }],
    recipes: [{
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RecipeRecommendation',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderType: {
        type: String,
        enum: ['dine-in', 'takeaway', 'delivery'],
        default: 'dine-in'
    },
    notes: String,
    estimatedTime: Date,
    actualDeliveryTime: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    restaurant: {
        type: String,
        required: true,
        trim: true,
        index: true
    }
}, { timestamps: true })

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        try {
            const count = await this.constructor.countDocuments();
            this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
        } catch (error) {
            // Fallback to timestamp-based order number if count fails
            this.orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        }
    }
    next();
});

export const Order = mongoose.model('Order', orderSchema)
