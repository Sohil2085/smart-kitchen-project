import mongoose from 'mongoose'

const ingredientSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true,
        },
        quantity : {
            type : Number,
            required : true,
        },
        unit : {
            type : String,
            enum : ["kg","litre","pcs"],
            required : true,
        },
        expirydate : {
            type : Date,
            required : true,
        } ,
        imageurl : {
            type : String,
        },
        category : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Category',
            required : true,
        }
    },
    {timestamps : true}
)

export const Ingredient = mongoose.model('Ingredient',ingredientSchema)