import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, createDefaultUsers, createRestaurantUsers, migrateExistingUsers } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/create-default-users").post(createDefaultUsers)

router.route("/create-restaurant-users").post(createRestaurantUsers)

router.route("/migrate-users").post(migrateExistingUsers)

export default router;