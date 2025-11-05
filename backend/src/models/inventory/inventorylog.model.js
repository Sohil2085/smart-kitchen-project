import mongoose from 'mongoose'

const inventoryLogSchema = new mongoose.Schema(
    {
        ingredient : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'InventoryItem',
        },
        change : Number, //+ve added or -ve if used
        reason : {
            type : String,
            required : true,
        },
        date : {
            type : Date,
            required : true,
        }
    },
    {timestamps : true}
)

export const Inventorylog = mongoose.model('Inventorylog',inventoryLogSchema) 