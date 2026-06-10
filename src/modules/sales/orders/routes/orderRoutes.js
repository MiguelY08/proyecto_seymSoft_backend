import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  registerOrderPayment,
} from '../controllers/orderControllers.js';

const router = Router();

// Crear pedido
router.post('/', createOrder);

// Obtener todos los pedidos
router.get('/', getAllOrders);

// Registrar pago o abono de un pedido
router.post('/:id/payments', registerOrderPayment);

// Obtener pedido por ID
router.get('/:id', getOrderById);

// Actualizar pedido
router.put('/:id', updateOrder);

// Cancelar pedido
router.patch('/:id/cancel', cancelOrder);

export default router;
