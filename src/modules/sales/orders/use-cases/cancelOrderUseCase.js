import { ORDER_STATUSES } from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';

const DEFAULT_CANCEL_REASON = 'Pedido cancelado.';

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

  async execute(id, reason = DEFAULT_CANCEL_REASON) {
    const order = await this.repo.findById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    // Evitar cancelar dos veces el mismo pedido.
    if (order.id_order_status === ORDER_STATUSES[4].id) {
      throw new AppError('El pedido ya esta cancelado.', 400);
    }

    const canceled = await this.repo.cancel(id);

    void notifyOrderCancelled({
      order: canceled,
      reason,
    });

    return mapOrder(canceled);
  }
}
