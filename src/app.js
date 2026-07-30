// Express application setup

import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "./config/google.js";
import { env } from "./config/env.js";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware.js";
import { authMiddleware } from "./shared/middlewares/authMiddleware.js";

import authRoutes from "./modules/auth/routes/authRoutes.js";
import userRoutes from "./modules/users/routes/userRoutes.js";
import roleRoutes from "./modules/settings/roles/routes/roleRoutes.js";

import categoryRoutes from "./modules/purchases/categories/routes/categoryRoutes.js";
import providerRoutes from "./modules/purchases/providers/routes/providerRoutes.js";
import clientRoutes from "./modules/sales/clients/routes/clientRoutes.js";
import vendingRoutes from "./modules/sales/vendings/routes/vendingRoutes.js";
import returnRoutes from "./modules/sales/sales-returns/routes/returnRoutes.js";
import productRoutes from "./modules/purchases/products/routes/productRoutes.js";
import supplierPurchaseRoutes from "./modules/purchases/supplierPurchases/routes/supplierPurchaseRoutes.js";
import purchaseReturnRoutes from "./modules/purchases/purchase-returns/routes/purchaseReturnRoutes.js";
import nonconformingRoutes from "./modules/purchases/non-conforming-products/routes/nonConformingRoutes.js";

import orderRoutes from "./modules/sales/orders/routes/orderRoutes.js";

import bannerRoutes from "./modules/settings/banners/routes/bannerRoutes.js";
import paymentsRoutes from "./modules/sales/payments/routes/paymentsRoutes.js";
import indicatorsRoutes from "./modules/performance/indicators/routes/indicatorRoutes.js";
import storefrontRoutes from "./modules/sales/storefront/routes/storefrontRoutes.js";
import locationRoutes from "./modules/locations/routes/locationRoutes.js";
import notificationRoutes from "./modules/notifications/routes/notificationRoutes.js";

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
app.use(cors({
  origin: env.CORS_ORIGIN.length > 0 ? env.CORS_ORIGIN : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* Sesion necesaria para Passport */
app.use(session({
  secret: env.JWT_ACCESS_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  }
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
 * Rutas de autenticacion
 */
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

/**
 * Rutas de usuarios
 */
app.use("/api/users", authMiddleware, userRoutes);

/**
 * Rutas de categorias y productos
 */
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

/* Rutas de pedidos */
app.use("/api/orders", orderRoutes);

/* Rutas de ubicaciones */
app.use("/api/locations", locationRoutes);

/* Rutas de proveedores */
app.use("/api/providers", providerRoutes);
app.use("/api/sales-returns", returnRoutes);
app.use("/api/products", productRoutes);
app.use("/api/supplier-purchases", supplierPurchaseRoutes);
app.use("/api/purchase-returns", purchaseReturnRoutes);
app.use('/api/non-conforming-products', nonconformingRoutes);

/* Rutas de banners */
app.use("/api/banners", bannerRoutes);

/* Rutas de roles */
app.use("/api/roles", roleRoutes);

/* Rutas de clientes */
app.use("/api/clients", clientRoutes);

/* Carrito y favoritos del cliente autenticado */
app.use("/api/storefront", storefrontRoutes);

/* Rutas de ventas */
app.use("/api/vendings", vendingRoutes);

/* Rutas de pagos y abonos */
app.use("/api/payments", paymentsRoutes);

/* Rutas de notificaciones */
app.use("/api/notifications", authMiddleware, notificationRoutes);

/* Rutas de Dashboard e indicadores */

app.use("/api/indicators", indicatorsRoutes);

/* Middleware global de errores (siempre al final) */
app.use(errorMiddleware);

export default app;
