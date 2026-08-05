// backend/src/modules/supplier-purchases/routes/supplierPurchaseRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

import { getAllSupplierPurchasesController } from '../controllers/getAllSupplierPurchasesController.js';
import { getSupplierPurchaseByIdController }  from '../controllers/getSupplierPurchaseByIdController.js';
import { createSupplierPurchaseController }   from '../controllers/createSupplierPurchaseController.js';
import { annulSupplierPurchaseController }    from '../controllers/annulSupplierPurchaseController.js';

const router = Router();

// router.use(authMiddleware);

// GET    /api/supplier-purchases              → lista paginada con filtros y ordenamiento
// POST   /api/supplier-purchases              → crear compra + detalles + barcodes extra + stock
// GET    /api/supplier-purchases/:id          → detalle con productos y barcodes
// PATCH  /api/supplier-purchases/:id/annul    → anular + revierte stock

router.get   ('/',          getAllSupplierPurchasesController);
router.post  ('/',          createSupplierPurchaseController);
router.get   ('/:id',       getSupplierPurchaseByIdController);
router.patch ('/:id/annul', annulSupplierPurchaseController);

export default router;