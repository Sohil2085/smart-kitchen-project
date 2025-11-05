import mongoose from 'mongoose'

const signupSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
        },
        password : {
            type : String,
            required : true,
            unique : true,
            minlength : [6, "Password is to Short (Enter 6 Character Password)"],
        },
        role : {
            type : String,
            enum : ["ADMIN","USER","OWNER"],
            default : "USER",
        },
    },
    {timestamps : true}
)

export const Signup = mongoose.model('Signup', signupSchema)