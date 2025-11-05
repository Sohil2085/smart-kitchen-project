import mongoose from 'mongoose'

const wasteLogSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    category: {
        type: String,
        enum: ['spoiled', 'over-portioning', 'expired', 'burnt', 'other'],
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
    },
    capturedImageUrl: String,   // Image of the wasted food for analysis
    loggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Signup' // User who logged the waste
    },
    loggedAt: {
        type: Date,
        default: Date.now
    },
    notes: String
}, { timestamps: true })

export const WasteLog = mongoose.model('WasteLog', wasteLogSchema)
