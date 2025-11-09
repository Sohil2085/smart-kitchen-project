import mongoose from 'mongoose'

const recipeRecommendationSchema = new mongoose.Schema({
    generatedRecipeName: {
        type: String,
        required: true
    },
    usedIngredients: [{
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryItem',
            required: true
        },
        quantity: Number,
        unit: {
            type: String,
            enum: ['kg', 'litre', 'pcs']
        }
    }],
    instructions: {
        type: String,
        required: true
    },
    generatedByAI: {
        type: Boolean,
        default: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    notes: String
}, { timestamps: true })

export const RecipeRecommendation = mongoose.model('RecipeRecommendation', recipeRecommendationSchema)
