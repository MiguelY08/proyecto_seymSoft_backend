import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderMapper }     from '../mappers/orderMapper.js';

const orderRepository = new OrderRepository();

export class GetOrderByIdUseCase {
  async execute(id) {
    const order = await orderRepository.findById(id);

    if (!order) {
      const error = new Error('Compra no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    return OrderMapper.toDTOWithDetails(order);
  }
}