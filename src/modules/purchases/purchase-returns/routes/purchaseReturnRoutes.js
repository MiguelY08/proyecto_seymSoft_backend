import express from "express";

import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

import {
  AnnularPurchaseReturnController,
  CreatePurchaseReturnController,
  GetAllPurchaseReturnsController,
  GetPurchaseReturnByIdController,
  GetPurchaseReturnMetricsController,
  UpdatePurchaseReturnController,
} from "../controllers/index.js";

const router = express.Router();

// router.use(authMiddleware);

// Obtener todas las devoluciones de compra
router.get("/", GetAllPurchaseReturnsController);

// Obtener metricas de devoluciones de compra
router.get("/metrics", GetPurchaseReturnMetricsController);

// Obtener devolucion de compra por ID
router.get("/:id", GetPurchaseReturnByIdController);

// Crear devolucion de compra
router.post("/", CreatePurchaseReturnController);

// Actualizar devolucion de compra
router.put("/:id", UpdatePurchaseReturnController);

// Anular devolucion de compra
router.patch("/:id/annul", AnnularPurchaseReturnController);

export default router;
