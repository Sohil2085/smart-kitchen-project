import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/auth/user.model.js";
import { apiError } from "../utils/apiError.js";
import { ACCESS_TOKEN_SECRET } from "../../constant.js";

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new apiError("Access token is required", 401);
        }

        const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        
        if (!user) {
            throw new apiError("Invalid access token - user not found", 401);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new apiError("Invalid access token", 401);
        } else if (error.name === 'TokenExpiredError') {
            throw new apiError("Access token has expired", 401);
        } else if (error.name === 'apiError') {
            throw error;
        } else {
            throw new apiError("Invalid access token", 401);
        }
    }
};

export const verifyAdminOrChef = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new apiError("Access token required", 401);
        }

        const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        
        if (!user) {
            throw new apiError("Invalid access token - user not found", 401);
        }

        // Check if user has admin or chef role
        if (user.role !== "admin" && user.role !== "chef") {
            throw new apiError("Access denied. Admin or Chef role required", 403);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new apiError("Invalid access token", 401);
        } else if (error.name === 'TokenExpiredError') {
            throw new apiError("Access token has expired", 401);
        } else if (error.name === 'apiError') {
            throw error;
        } else {
            throw new apiError("Invalid access token", 401);
        }
    }
};

export const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new apiError("User not authenticated", 401);
        }

        if (req.user.role !== "admin") {
            throw new apiError("Access denied. Admin role required", 403);
        }

        next();
    } catch (error) {
        throw new apiError(error.message || "Admin access required", error.statusCode || 403);
    }
};

export const verifyChef = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new apiError("User not authenticated", 401);
        }

        if (req.user.role !== "chef" && req.user.role !== "admin") {
            throw new apiError("Access denied. Chef or Admin role required", 403);
        }

        next();
    } catch (error) {
        throw new apiError(error.message || "Chef access required", error.statusCode || 403);
    }
};
