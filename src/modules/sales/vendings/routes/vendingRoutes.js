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


const router = express.Router();

// Obtener todas las ventas
router.get("/", GetAllVendingsController);

// Obtener métricas de ventas
router.get("/metrics", GetVendingMetricsController);

// Obtener ventas manuales
router.get("/manual", GetManualVendingsController);

// Obtener ventas directas
router.get("/direct", GetDirectVendingsController);

// Obtener ventas web
router.get("/web", GetWebVendingsController);

// Obtener venta por ID
router.get("/:id", GetVendingByIdController);

// Crear venta según tipo
router.post("/:vendingType", CreateVendingController);

// Anular venta
router.post("/:id/annular", AnnularVendingController);

// Actualizar venta
router.put("/:id", UpdateVendingController);

export default router;
