// Express application setup

import express from "express";
import cors from "cors";
import morgan from "morgan";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware.js";
import authRoutes from "./modules/auth/routes/authRoutes.js";
import userRoutes from "./modules/users/routes/userRoutes.js";
import categoryRoutes from "./modules/purchases/categories/routes/categoryRoutes.js";
import providerRoutes from "./modules/purchases/providers/routes/providerRoutes.js"
import clientRoutes from './modules/sales/clients/routes/clientRoutes.js';
import productRoutes from "./modules/purchases/products/routes/productRoutes.js";

const app = express();

/* Middlewares globales */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/* Ruta health check */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend running successfully",
  });
});

/* Rutas de autenticación */
app.use("/auth", authRoutes);

/* Rutas de categorias */
app.use("/api/categories", categoryRoutes);

/* Rutas de proveedores */
app.use("/api/providers", providerRoutes);
app.use("/api/products", productRoutes);

/* Rutas de usuarios */
app.use("/users", userRoutes);

/* Rutas de proveedores */
app.use('/api/clients', clientRoutes);

/* Middleware global de errores (siempre al final) */
app.use(errorMiddleware);

export default app;
