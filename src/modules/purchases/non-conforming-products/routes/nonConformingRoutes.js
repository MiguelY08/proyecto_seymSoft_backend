// backend/src/modules/purchases/non-conforming-products/routes/nonConformingRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

import { getAllNonConformingController } from '../controllers/getAllNonConformingController.js';
import { createNonConformingController } from '../controllers/createNonConformingController.js';
import { cancelNonConformingController } from '../controllers/cancelNonConformingController.js';
import { getProductByBarcodeController } from '../controllers/getProductByBarcodeController.js';

const router = Router();

// router.use(authMiddleware);

router.get('/', getAllNonConformingController);
router.post('/', createNonConformingController);
router.patch('/:id/cancel', cancelNonConformingController);
router.get('/barcode/:barcode', getProductByBarcodeController);

export default router; // ← ESTA LÍNEA ES IMPORTANTE    