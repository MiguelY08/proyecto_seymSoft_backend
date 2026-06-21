// src/modules/sales/sales-returns/routes/returnRoutes.js

import { Router } from 'express';
import multer from 'multer';
import {
  createReturnController,
  getAllReturnsController,
  getReturnByIdController,
  updateReturnController,
  cancelReturnController,
  getAvailableInvoicesController,
  getPurchaseReturnInfoController,
  getReturnableSalesController
} from '../controllers/index.js';
import { deleteEvidenceController } from '../controllers/deleteEvidenceController.js';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/', (req, res, next) => {
  upload.array('evidences')(req, res, (err) => {
    if (err) {
      console.error('❌ Error en multer:', err);
      
      // ✅ Mensaje específico para archivo muy grande
      let message = 'Error al subir archivos';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = '❌ La imagen es demasiado grande. El tamaño máximo permitido es 50MB.';
      } else {
        message = err.message;
      }
      
      return res.status(400).json({ 
        success: false, 
        message: message 
      });
    }
    next();
  });
}, createReturnController);

router.get('/', getAllReturnsController);
router.get('/returnable-sales', getReturnableSalesController);
router.get('/available-invoices', getAvailableInvoicesController);
router.get('/purchase-return-info', getPurchaseReturnInfoController);
router.delete('/evidence/:id', deleteEvidenceController);

router.get('/:id', getReturnByIdController);
router.put('/:id', updateReturnController);
router.patch('/:id/cancel', cancelReturnController);

export default router;