import express from "express";

import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";
import { requirePermission } from "../../../../shared/middlewares/requirePermission.js";

import {
  AnnularPurchaseReturnController,
  CreatePurchaseReturnController,
  GetAllPurchaseReturnsController,
  GetPurchaseReturnByIdController,
  GetPurchaseReturnMetricsController,
  UpdatePurchaseReturnController,
} from "../controllers/index.js";

const router = express.Router();
const MODULE = "Devoluciones_en_compras";

router.use(authMiddleware);

// Obtener todas las devoluciones de compra
router.get("/", requirePermission(MODULE, "READ"), GetAllPurchaseReturnsController);

// Obtener metricas de devoluciones de compra
router.get("/metrics", requirePermission(MODULE, "READ"), GetPurchaseReturnMetricsController);

// Obtener devolucion de compra por ID
router.get("/:id", requirePermission(MODULE, "READ_DETAIL"), GetPurchaseReturnByIdController);

// Crear devolucion de compra
router.post("/", requirePermission(MODULE, "CREATE"), CreatePurchaseReturnController);

// Actualizar devolucion de compra
router.put("/:id", requirePermission(MODULE, "UPDATE"), UpdatePurchaseReturnController);

// Anular devolucion de compra
router.patch("/:id/annul", requirePermission(MODULE, "ANULAR"), AnnularPurchaseReturnController);

export default router;
