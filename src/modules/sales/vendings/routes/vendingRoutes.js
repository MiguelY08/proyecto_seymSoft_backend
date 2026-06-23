import express from "express";

import {
  AnnularVendingController,
  CreateVendingController,
  GetAllVendingsController,
  GetDirectVendingsController,
  GetManualVendingsController,
  GetVendingByIdController,
  GetVendingMetricsController,
  GetWebVendingsController,
  UpdateVendingController,
} from "../controllers/index.js";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", authMiddleware, GetAllVendingsController);

// Obtener métricas de ventas
router.get("/metrics", authMiddleware, GetVendingMetricsController);

// Obtener ventas manuales
router.get("/manual", authMiddleware, GetManualVendingsController);

// Obtener ventas directas
router.get("/direct", authMiddleware, GetDirectVendingsController);

// Obtener ventas web
router.get("/web", authMiddleware, GetWebVendingsController);

// Obtener venta por ID
router.get("/:id", authMiddleware, GetVendingByIdController);

// Crear venta según tipo
router.post("/:vendingType", authMiddleware, CreateVendingController);

// Anular venta
router.post("/:id/annular", authMiddleware, AnnularVendingController);

// Actualizar venta
router.put("/:id", authMiddleware, UpdateVendingController);

export default router;
