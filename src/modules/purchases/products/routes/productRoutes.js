import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

import {
  createProduct,
  getAllProducts,
  getUnitMeasures,
  getProductById,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from '../controllers/productControllers.js';

const router = Router();

// Configurar multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 20,
    fileSize: 10 * 1024 * 1024,
  },
});

// Otras rutas
router.get('/', getAllProducts);
router.get('/unit-measures', getUnitMeasures);
router.get('/:id', getProductById);

// Rutas administrativas
router.post('/', authMiddleware, upload.any(), createProduct);
router.put('/:id', authMiddleware, upload.any(), updateProduct);
router.patch('/:id/toggle', authMiddleware, toggleProductStatus);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;
