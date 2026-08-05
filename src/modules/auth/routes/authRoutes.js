import express from "express";
import passport from "../../../config/google.js";
import { LoginController } from "../controllers/loginController.js";
import { RefreshTokenController } from "../controllers/refreshTokenController.js";
import { LogoutController } from "../controllers/logoutController.js";
import { RegisterController } from "../controllers/registerController.js";
import { CheckEmailAvailabilityController } from "../controllers/checkEmailAvailabilityController.js";
import { ProfileController } from "../controllers/profileController.js";
import { ProfileSummaryController } from "../controllers/profileSummaryController.js";
import { UpdateProfileController } from "../controllers/updateProfileController.js";
import { ForgotPasswordController } from "../controllers/forgotPasswordController.js";
import { ResetPasswordController } from "../controllers/resetPasswordController.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";
import { GoogleAuthController } from "../controllers/googleAuthController.js";
import { ChangePasswordController } from "../controllers/changePasswordController.js";



const router = express.Router();

// POST /auth/register
router.post("/register", RegisterController.register);

// GET /auth/check-email
router.get("/check-email", CheckEmailAvailabilityController.check);

// POST /auth/login
router.post("/login", LoginController.login);

// POST /auth/refresh
router.post("/refresh", RefreshTokenController.refresh);

// POST /auth/logout
router.post("/logout", LogoutController.logout);

// GET /auth/me (protected)
router.get("/me", authMiddleware, ProfileController.getProfile);

// GET /auth/profile (protected)
router.get("/profile", authMiddleware, ProfileSummaryController.getSummary);

// PUT /auth/profile (protected)
router.put("/profile", authMiddleware, UpdateProfileController.updateProfile);

// POST /auth/forgot-password
router.post("/forgot-password", ForgotPasswordController.forgotPassword);

// NUEVA RUTA: Validar código en tiempo real
router.post("/validate-code", ResetPasswordController.validateCode);

// POST /auth/reset-password
router.post("/reset-password", ResetPasswordController.resetPassword);

// POST /auth/change-password (protected)
router.post("/change-password",authMiddleware, ChangePasswordController.changePassword);

// ===== GOOGLE OAUTH =====
// GET /auth/google - Redirige a Google para autorizar
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// GET /auth/google/callback - Google redirige aquí después de autorizar
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  GoogleAuthController.googleCallback,
);

export default router;
