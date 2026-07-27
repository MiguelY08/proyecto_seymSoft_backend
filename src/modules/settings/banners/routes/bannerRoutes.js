import { Router } from "express";
import { uploadBannerImage } from "../middlewares/bannerMiddleware.js";

import {
  createBannerController,
  deleteBannerController,
  getActiveBannersController,
  getAllBannersController,
  getBannerByIdController,
  reorderActiveBannersController,
  toggleBannerStatusController,
} from "../controllers/index.js";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

/**
 * Rutas del módulo Banner
 *
 * Base esperada en app.js:
 * app.use("/api/banners", bannerRoutes);
 */

const router = Router();

/**
 * Obtener banners activos
 * GET /api/banners/active
 */
router.get("/active", getActiveBannersController);

/**
 * Reordenar banners activos
 * PATCH /api/banners/active/reorder
 */
router.patch("/active/reorder", authMiddleware, reorderActiveBannersController);

/**
 * Obtener todos los banners
 * GET /api/banners
 */
router.get("/", authMiddleware, getAllBannersController);

/**
 * Obtener banner por ID
 * GET /api/banners/:id
 */
router.get("/:id", authMiddleware, getBannerByIdController);

/**
 * Crear banner
 * POST /api/banners
 *
 * Campo esperado en multipart/form-data:
 * image
 */
router.post("/", authMiddleware, uploadBannerImage, createBannerController);

/**
 * Activar / desactivar banner
 * PATCH /api/banners/:id/status
 */
router.patch("/:id/status", authMiddleware, toggleBannerStatusController);

/**
 * Eliminar banner
 * DELETE /api/banners/:id
 */
router.delete("/:id", authMiddleware, deleteBannerController);

export default router;