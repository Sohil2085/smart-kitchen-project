import mongoose from 'mongoose'

const wasteAnalysisSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem'
    },
    totalWasteQuantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        enum: ['pcs', 'kg', 'ltr', 'g', 'ml', 'lb', 'oz']
    },
    wastePercentage: Number,  // Waste as % of total used
    wasteCategoryBreakdown: [{
        category: {
            type: String,
            enum: ['spoiled', 'over-portioning', 'expired', 'burnt', 'other']
        },
        quantity: Number
    }],
    financialLoss: Number,  // In currency
    heatmapArea: String,    // E.g., 'Prep Station', 'Grill Station'
    analysisDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

export const WasteAnalysis = mongoose.model('WasteAnalysis', wasteAnalysisSchema)
