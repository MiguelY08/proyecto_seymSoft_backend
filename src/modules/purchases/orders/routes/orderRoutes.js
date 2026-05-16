import { Router } from 'express';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

import { getAllOrdersController } from '../controllers/getAllOrdersController.js';
import { getOrderByIdController } from '../controllers/getOrderByIdController.js';
import { createOrderController } from '../controllers/createOrderController.js';
import { annulOrderController } from '../controllers/annulOrderController.js';

const router = Router();

// router.use(authMiddleware);

// GET   /api/orders              → lista paginada con filtros
// POST  /api/orders              → crear compra + detalles + actualiza stock
// GET   /api/orders/:id          → detalle con productos
// PATCH /api/orders/:id/annul    → anular compra + revierte stock

router.get   ('/',          getAllOrdersController);
router.post  ('/',          createOrderController);
router.get   ('/:id',       getOrderByIdController);
router.patch ('/:id/annul', annulOrderController);

export default router;