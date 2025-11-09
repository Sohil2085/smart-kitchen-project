import mongoose from 'mongoose'

const loginSchema = new mongoose.Schema(
    {
        email : {
            type : String,
            required : true,
            unique : true,
        },
        password : {
            type : String,
            required : true,
            unique : true,
            minlength : [6, "Password is to Short (Enter 6 Character Password)"],
        }
    },
    {timestamps : true}
)

export const Login = mongoose.model('Login',loginSchema)