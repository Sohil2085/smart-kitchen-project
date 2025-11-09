import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../../../constant.js";

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type: String, //from cloudinary url or default avatar
        required : true,
    },
    coverImage : {
        type: String, //from cloudinary url
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type : String,
        required : [true,'Password is Required'],
    },
    refreshToken : {
        type : String,
    },
    role : {
        type : String,
        enum : ["admin", "chef", "employee"],
        default : "employee",
        required : true
    },
    restaurant : {
        type : String,
        required : false,
        trim : true,
        index : true,
        default : "restaurant1"
    }
},{timestamps : true})

userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname,
            role : this.role
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn : ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname,
            role : this.role
        },
        REFRESH_TOKEN_SECRET,
        {
            expiresIn : REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)