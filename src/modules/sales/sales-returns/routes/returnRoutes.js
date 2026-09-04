// src/modules/sales/sales-returns/routes/returnRoutes.js

import { Router } from 'express';
import multer from 'multer';
import {
  createReturnController,
  getAllReturnsController,
  getReturnByIdController,
  updateReturnController,
  cancelReturnController,
  cancelReturnDetailController,
  getAvailableInvoicesController,
  getPurchaseReturnInfoController,
  getReturnableSalesController,
  resolveDefectiveProductController
} from '../controllers/index.js';
import { deleteEvidenceController } from '../controllers/deleteEvidenceController.js';
import {
  getMyReturnByIdController,
  getMyReturnsController
} from '../controllers/getMyReturnsController.js';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadEvidences = (req, res, next) => {
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
};

router.post('/', uploadEvidences, createReturnController);

router.get('/', getAllReturnsController);
router.get('/my-returns', authMiddleware, getMyReturnsController);
router.get('/my-returns/:id', authMiddleware, getMyReturnByIdController);
router.get('/returnable-sales', getReturnableSalesController);
router.get('/available-invoices', getAvailableInvoicesController);
router.get('/purchase-return-info', getPurchaseReturnInfoController);
router.delete('/evidence/:id', deleteEvidenceController);
router.post('/:id/details/:detailId/defective-resolution', resolveDefectiveProductController);
router.patch('/:id/details/:detailId/cancel', cancelReturnDetailController);

router.get('/:id', getReturnByIdController);
router.put('/:id', uploadEvidences, updateReturnController);
router.patch('/:id/cancel', cancelReturnController);

export default router;
