import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  registerOrderPayment,
  uploadOrderPaymentReceipt,
} from '../controllers/orderControllers.js';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';
import {
  uploadOrderPaymentReceipt as uploadReceiptImage,
} from '../middlewares/orderPaymentReceiptMiddleware.js';

const router = Router();

// Crear pedido
router.post('/', authMiddleware, createOrder);

// Obtener todos los pedidos
router.get('/', authMiddleware, getAllOrders);

// Registrar pago o abono de un pedido
router.post('/:id/payments', authMiddleware, registerOrderPayment);

// Adjuntar comprobante pendiente de verificacion sin registrar un pago
router.post(
  '/:id/payment-receipts',
  authMiddleware,
  uploadReceiptImage,
  uploadOrderPaymentReceipt
);

// Obtener pedido por ID
router.get('/:id', authMiddleware, getOrderById);

// Actualizar pedido
router.put('/:id', authMiddleware, updateOrder);

// Cancelar pedido
router.patch('/:id/cancel', authMiddleware, cancelOrder);

export default router;
