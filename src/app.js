// Express application setup

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "./config/google.js";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware.js";
import { handleUploadError } from "./shared/middlewares/uploadMiddleware.js";

import authRoutes from "./modules/auth/routes/authRoutes.js";
import userRoutes from "./modules/users/routes/userRoutes.js";
import roleRoutes from "./modules/settings/roles/routes/roleRoutes.js";

import categoryRoutes from "./modules/purchases/categories/routes/categoryRoutes.js";
import providerRoutes from "./modules/purchases/providers/routes/providerRoutes.js"
import productRoutes from "./modules/purchases/products/routes/productRoutes.js";

import bannerRoutes from "./modules/settings/banners/routes/bannerRoutes.js";

const app = express();

/**
 * __dirname compatible con ES Modules
 */
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

/**
 * Middlewares globales
 */
app.use(cors());

app.use(express.json());

app.use(morgan("dev"));

/**
 * Middleware de errores de upload
 */
app.use(handleUploadError);

/**
 * Servir imágenes estáticas
 *
 * URL pública:
 * http://localhost:3000/uploads/banners/banner_xxx.webp
 *
 * Carpeta física:
 * src/uploads
 */
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/**
 * Health Check
 */
/* Sesión (necesario para Passport) */
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

/* Inicializar Passport */
app.use(passport.initialize());
app.use(passport.session());

/* Ruta health check */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Backend running successfully",
  });
});

/**
 * Rutas de autenticación
 */
app.use("/auth", authRoutes);
/* Rutas de autenticación */
app.use("/api/auth", authRoutes);  

/**
 * Rutas de usuarios
 */
app.use("/api/users", userRoutes);

/**
 * Rutas de categorías y productos
 */
app.use("/api/categories", categoryRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/products", productRoutes);

/**
 * Rutas de banners
 */
app.use("/api/banners", bannerRoutes);

/**
 * Middleware global de errores
 * SIEMPRE al final
 */
/* Rutas de Roles */
app.use("/api/roles", roleRoutes);

/* Middleware global de errores (siempre al final) */
app.use(errorMiddleware);

export default app;