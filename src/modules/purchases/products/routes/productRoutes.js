import { Router } from 'express';
import multer from 'multer';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from '../controllers/productControllers.js';

const router = Router();

// Configurar multer
const upload = multer({ storage: multer.memoryStorage() });

// Ruta POST con multer
router.post('/', upload.array('images', 10), createProduct);

// Otras rutas
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.array('images', 10), updateProduct);
router.patch('/:id/toggle', toggleProductStatus);
router.delete('/:id', deleteProduct);

export default router;