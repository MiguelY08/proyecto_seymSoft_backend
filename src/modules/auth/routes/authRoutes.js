import express from "express";
import { LoginController } from "../controllers/loginController.js";
import { RefreshTokenController } from "../controllers/refreshTokenController.js";
import { LogoutController } from "../controllers/logoutController.js";
import { RegisterController } from "../controllers/registerController.js";
import { ProfileController } from "../controllers/profileController.js";
import { UpdateProfileController } from "../controllers/updateProfileController.js";
import { ChangePasswordController } from "../controllers/changePasswordController.js";
import { ForgotPasswordController } from "../controllers/forgotPasswordController.js";
import { ResetPasswordController } from "../controllers/resetPasswordController.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";

const router = express.Router();

// POST /auth/register
router.post("/register", RegisterController.register);

// POST /auth/login
router.post("/login", LoginController.login);

// POST /auth/refresh
router.post("/refresh", RefreshTokenController.refresh);

// POST /auth/logout
router.post("/logout", LogoutController.logout);

// GET /auth/me (protected)
router.get("/me", authMiddleware, ProfileController.getProfile);

// PUT /auth/profile (protected) - Actualizar perfil y/o cambiar contraseña
router.put("/profile", authMiddleware, UpdateProfileController.updateProfile);

// PUT /auth/change-password (protected)
router.put(
  "/change-password",
  authMiddleware,
  ChangePasswordController.changePassword,
);

// POST /auth/forgot-password
router.post("/forgot-password", ForgotPasswordController.forgotPassword);

// POST /auth/reset-password
router.post("/reset-password", ResetPasswordController.resetPassword);

export default router;
