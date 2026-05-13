// Express application setup

import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "./config/google.js";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware.js";
import authRoutes from "./modules/auth/routes/authRoutes.js";
import userRoutes from "./modules/users/routes/userRoutes.js";
import categoryRoutes from "./modules/purchases/categories/routes/categoryRoutes.js";
import roleRoutes from "./modules/settings/roles/routes/roleRoutes.js";
import productRoutes from "./modules/purchases/products/routes/productRoutes.js";
const app = express();

/* Middlewares globales */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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
  res.json({
    success: true,
    message: "Backend running successfully",
  });
});

/* Rutas de autenticación */
app.use("/api/auth", authRoutes);  

/* Rutas de categorias */
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

/* Rutas de usuarios */
app.use("/users", userRoutes);

/* Rutas de Roles */
app.use("/api/roles", roleRoutes);

/* Middleware global de errores (siempre al final) */
app.use(errorMiddleware);

export default app;