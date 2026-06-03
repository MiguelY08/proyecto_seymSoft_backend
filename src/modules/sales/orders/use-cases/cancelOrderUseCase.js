import { AppError } from '../../../../shared/errors/AppError.js';
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

    if (order.id_order_status === 4) {
      throw new AppError('El pedido ya está cancelado.', 400);
    }

    const canceled = await this.repo.cancel(id);

    return mapOrder(canceled);
  }
}