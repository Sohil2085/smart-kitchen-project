import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    ingredients: [{
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['pcs', 'kg', 'ltr', 'g', 'ml', 'lb', 'oz'],
            required: true
        }
    }],
    baseCost: {
        type: Number,
        required: true
    },
    suggestedPrice: {
        type: Number,
        required: true
    },
    profitMargin: Number,
    imageUrl: String,
    restaurant: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    stockStatus: {
        type: String,
        enum: ['available', 'out_of_stock', 'low_stock'],
        default: 'available'
    }
}, { timestamps: true })

export const MenuItem = mongoose.model('MenuItem', menuItemSchema)
