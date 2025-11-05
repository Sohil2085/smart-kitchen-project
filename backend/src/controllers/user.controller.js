import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/auth/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../../constant.js";


const registerUser = asyncHandler(async (req, res) => {
    //get user detail 
    //validation - not empty
    //check if user already exists : with username or email
    //check for images and avatars
    //upload them on cloudinary
    //create user object - create entry in db
    //remove password and refresh token from user object
    //check for user creation
    //return res

    const {fullname,email,username,password,role,restaurant} = req.body
    console.log("email : ", email)
    
    if(
        [fullname,email,username,password].some((field) => field?.trim() === "")
    ){
        throw new apiError("All fields are required", 400);
    }

    const existedUser = await User.findOne({
        $or : [ {username}, {email} ]
    })

    if(existedUser){
        throw new apiError("User already exists", 409)
    }

    // Handle file uploads (optional)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    let avatarUrl = "";
    let coverImageUrl = "";

    // Upload avatar if provided, otherwise use default
    if (avatarLocalPath) {
        const avatar = await uploadCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new apiError("Avatar upload failed", 400);
        }
        avatarUrl = avatar.url;
    } else {
        // Use a default avatar URL or generate initials-based avatar
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random&color=fff&size=200`;
    }

    // Upload cover image if provided
    if (coverImageLocalPath) {
        const coverImage = await uploadCloudinary(coverImageLocalPath);
        if (coverImage) {
            coverImageUrl = coverImage.url;
        }
    }

    const user  = await User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar : avatarUrl,
        coverImage : coverImageUrl,
        role : role || "employee",
        restaurant : restaurant || "restaurant1"
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new apiError("User creation failed", 400);
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully")
    )
});



const loginUser = asyncHandler(async (req, res) => {
    // Get user details from request
    const { email, password } = req.body;

    // Validation - check if email and password are provided
    if (!email || !password) {
        throw new apiError("Email and password are required", 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new apiError("User not found", 404);
    }

    // Check if password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new apiError("Invalid credentials", 401);
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Update user's refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Get user details without password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set cookie options
    const options = {
        httpOnly: true,
        secure: false // Set to false for development, true for production with HTTPS
    };

    // Return response with tokens and user data
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // Clear refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from document
            }
        },
        {
            new: true
        }
    );

    // Clear cookies
    const options = {
        httpOnly: true,
        secure: false // Set to false for development, true for production with HTTPS
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new apiError("Unauthorized request", 401);
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new apiError("Invalid refresh token", 401);
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError("Refresh token is expired or used", 401);
        }

        const options = {
            httpOnly: true,
            secure: false // Set to false for development, true for production with HTTPS
        };

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new apiError("Invalid refresh token", 401);
    }
});

const createDefaultUsers = asyncHandler(async (req, res) => {
    try {
        // Check if default users already exist
        const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
        const existingChef = await User.findOne({ email: "chef@gmail.com" });

        if (existingAdmin && existingChef) {
            return res.status(200).json(
                new apiResponse(200, {}, "Default users already exist")
            );
        }

        const users = [];

        // Create admin user if not exists
        if (!existingAdmin) {
            const adminUser = await User.create({
                fullname: "Admin User",
                email: "admin@gmail.com",
                username: "admin",
                password: "admin123",
                role: "admin",
                restaurant: "restaurant1",
                avatar: "https://ui-avatars.com/api/?name=Admin&background=random&color=fff&size=200"
            });
            users.push(adminUser);
        }

        // Create chef user if not exists
        if (!existingChef) {
            const chefUser = await User.create({
                fullname: "Chef User",
                email: "chef@gmail.com",
                username: "chef",
                password: "chef123",
                role: "chef",
                restaurant: "restaurant1",
                avatar: "https://ui-avatars.com/api/?name=Chef&background=random&color=fff&size=200"
            });
            users.push(chefUser);
        }

        return res.status(201).json(
            new apiResponse(201, { users }, "Default users created successfully")
        );
    } catch (error) {
        throw new apiError("Failed to create default users", 500);
    }
});

// Create users for different restaurants
const createRestaurantUsers = asyncHandler(async (req, res) => {
    try {
        const restaurants = [
            { name: "restaurant1", displayName: "Restaurant 1" },
            { name: "restaurant2", displayName: "Restaurant 2" },
            { name: "restaurant3", displayName: "Restaurant 3" }
        ];

        const createdUsers = [];

        for (const restaurant of restaurants) {
            // Check if users already exist for this restaurant
            const existingAdmin = await User.findOne({ 
                email: `admin@${restaurant.name}.com` 
            });
            const existingChef = await User.findOne({ 
                email: `chef@${restaurant.name}.com` 
            });

            // Create admin user if not exists
            if (!existingAdmin) {
                const adminUser = await User.create({
                    fullname: `${restaurant.displayName} Admin`,
                    email: `admin@${restaurant.name}.com`,
                    username: `admin_${restaurant.name}`,
                    password: "admin123",
                    role: "admin",
                    restaurant: restaurant.name,
                    avatar: `https://ui-avatars.com/api/?name=${restaurant.displayName}+Admin&background=random&color=fff&size=200`
                });
                createdUsers.push(adminUser);
            }

            // Create chef user if not exists
            if (!existingChef) {
                const chefUser = await User.create({
                    fullname: `${restaurant.displayName} Chef`,
                    email: `chef@${restaurant.name}.com`,
                    username: `chef_${restaurant.name}`,
                    password: "chef123",
                    role: "chef",
                    restaurant: restaurant.name,
                    avatar: `https://ui-avatars.com/api/?name=${restaurant.displayName}+Chef&background=random&color=fff&size=200`
                });
                createdUsers.push(chefUser);
            }
        }

        return res.status(201).json(
            new apiResponse(201, { users: createdUsers }, "Restaurant users created successfully")
        );
    } catch (error) {
        console.error("Error creating restaurant users:", error);
        throw new apiError(500, "Failed to create restaurant users");
    }
});

// Migrate existing users to add restaurant field
const migrateExistingUsers = asyncHandler(async (req, res) => {
    try {
        // Find all users without restaurant field
        const usersWithoutRestaurant = await User.find({ 
            $or: [
                { restaurant: { $exists: false } },
                { restaurant: null },
                { restaurant: "" }
            ]
        });

        console.log(`Found ${usersWithoutRestaurant.length} users without restaurant field`);

        // Update each user with default restaurant
        const updatedUsers = [];
        for (const user of usersWithoutRestaurant) {
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { restaurant: "restaurant1" },
                { new: true }
            );
            updatedUsers.push(updatedUser);
        }

        return res.status(200).json(
            new apiResponse(200, { 
                message: `Updated ${updatedUsers.length} users with restaurant field`,
                users: updatedUsers 
            }, "Migration completed successfully")
        );
    } catch (error) {
        console.error("Error migrating users:", error);
        throw new apiError(500, "Failed to migrate existing users");
    }
});

// Helper function to generate both access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError("Something went wrong while generating refresh and access token", 500);
    }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken, createDefaultUsers, createRestaurantUsers, migrateExistingUsers }