import { ORDER_STATUSES } from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';

const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;

const notifyOrderCancelled = async ({ order, reason }) => {
  const mappedOrder = mapOrder(order);
  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    await EmailService.sendOrderCancelledEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      reason,
      total: mappedOrder.total,
    });
  } catch (error) {
    console.error('[CancelOrderUseCase] Email error:', error.message);
  }
};

export class CancelOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, reason) {
    const normalizedReason = String(reason || '').trim();

    if (!normalizedReason) {
      throw new AppError('El motivo de cancelacion es obligatorio.', 400);
    }

    if (normalizedReason.length > 255) {
      throw new AppError('El motivo de cancelacion no puede exceder 255 caracteres.', 400);
    }

    const order = await this.repo.findUpdateStateById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.id_order_status === DELIVERED_ORDER_STATUS_ID) {
      throw new AppError('No se puede cancelar un pedido entregado.', 400);
    }

    // Evitar cancelar dos veces el mismo pedido.
    if (order.id_order_status === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError('El pedido ya esta cancelado.', 400);
    }

    const canceled = await this.repo.cancel(id, normalizedReason);

    void notifyOrderCancelled({
      order: canceled,
      reason: normalizedReason,
    });

    return mapOrder(canceled);
  }
}
