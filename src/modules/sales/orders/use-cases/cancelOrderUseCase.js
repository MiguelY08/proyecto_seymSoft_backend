import { ORDER_STATUSES } from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { mapOrder } from '../mappers/orderMapper.js';

export class CancelOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const order = await this.repo.findById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    // Evitar cancelar dos veces el mismo pedido.
    if (order.id_order_status === ORDER_STATUSES[4].id) {
      throw new AppError('El pedido ya esta cancelado.', 400);
    }

    const canceled = await this.repo.cancel(id);

    return mapOrder(canceled);
  }
}
