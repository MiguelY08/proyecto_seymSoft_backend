import { AppError } from '../../../../shared/errors/AppError.js';
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

    return mapOrder(order);
  }
}