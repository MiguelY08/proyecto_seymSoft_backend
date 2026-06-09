import { AppError } from '../../../../shared/errors/appError.js';
import { mapOrder } from '../mappers/orderMapper.js';

export class GetOrderByIdUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const order = await this.repo.findById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    // Entregar el pedido con el formato publico definido por el mapper.
    return mapOrder(order);
  }
}
