import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { DELIVERY_TYPES } from '../../shared/deliveryTypes.js';
import { mapOrder } from '../mappers/orderMapper.js';

const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;
const PAID_PAYMENT_STATUS_ID = PAYMENT_STATUSES[2].id;

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const getRawShippingAmount = (data = {}) =>
  data.shippingAmount ??
  data.shipping_amount ??
  data.deliveryAmount ??
  data.delivery_amount ??
  data.envio;

const normalizeShippingAmount = (data = {}) => {
  const rawAmount = getRawShippingAmount(data);

  if (
    rawAmount === undefined ||
    rawAmount === null ||
    String(rawAmount).trim() === ''
  ) {
    throw new AppError('El valor del envio es obligatorio.', 400);
  }

  const amount = Number(rawAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      'El valor del envio debe ser un numero mayor a 0.',
      400
    );
  }

  return roundMoney(amount);
};

export class UpdateOrderShippingUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, data = {}) {
    const shippingAmount = normalizeShippingAmount(data);
    const order = await this.repo.findShippingUpdateStateById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.delivery_type !== DELIVERY_TYPES.DELIVERY) {
      throw new AppError(
        'Solo se puede registrar envio para pedidos a domicilio.',
        400
      );
    }

    if (order.id_order_status === DELIVERED_ORDER_STATUS_ID) {
      throw new AppError(
        'No se puede modificar el envio de un pedido entregado.',
        400
      );
    }

    if (order.id_order_status === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError(
        'No se puede modificar el envio de un pedido cancelado.',
        400
      );
    }

    if (order.id_payment_status === PAID_PAYMENT_STATUS_ID || order.sales) {
      throw new AppError(
        'No se puede modificar el envio de un pedido pagado o con venta asociada.',
        400
      );
    }

    const subtotal = roundMoney(order.subtotal);
    const ivaAmount = roundMoney(order.iva_amount);
    const total = roundMoney(subtotal + ivaAmount + shippingAmount);
    const updatedOrder = await this.repo.updateShippingAmount(order.id_order, {
      shippingAmount,
      total,
    });

    return {
      order: mapOrder(updatedOrder),
      shippingNotification:
        roundMoney(order.shipping_amount) <= 0
          ? { order: updatedOrder }
          : null,
    };
  }
}
