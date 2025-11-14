import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { CORS_ORIGIN } from "./constant.js"

const app = express()

app.use(cors({
    origin : CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true,limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from "./src/routes/user.route.js"
import inventoryRouter from "./src/routes/inventory.route.js"
import dashboardRouter from "./src/routes/dashboard.route.js"
import menuRouter from "./src/routes/menu.route.js"
import orderRouter from "./src/routes/order.route.js"
import salesRouter from "./src/routes/sales.route.js"

//routes declaration
app.use("/api/v1/user",userRouter)
app.use("/api/v1/inventory",inventoryRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/menu",menuRouter)
app.use("/api/v1/orders",orderRouter)
app.use("/api/v1/sales",salesRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    console.error("Error stack:", err.stack);
    
    if (err.name === 'apiError') {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            data: null,
            errors: err.errors || []
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            data: null,
            errors: errors
        });
    }
    
    // Handle cast errors (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
            data: null,
            errors: []
        });
    }
    
    // Handle other types of errors
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        data: null,
        errors: []
    });
});

export {app}