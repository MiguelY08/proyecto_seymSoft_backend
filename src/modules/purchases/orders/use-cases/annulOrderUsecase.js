import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderMapper }     from '../mappers/orderMapper.js';

const orderRepository = new OrderRepository();

export class AnnulOrderUseCase {
  async execute(id, dto) {
    const existing = await orderRepository.findById(id);

    if (!existing) {
      const error = new Error('Compra no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    // 1 = Completada | 2 = Proc. devolución | 3 = Anulada
    if (existing.id_purchase_status === 3) {
      const error = new Error('Esta compra ya se encuentra anulada.');
      error.statusCode = 409;
      throw error;
    }

    if (existing.id_purchase_status === 2) {
      const error = new Error('Esta compra tiene un proceso de devolución activo y no puede anularse.');
      error.statusCode = 409;
      throw error;
    }

    const updated = await orderRepository.annul(id, dto.cancellationReason);
    return OrderMapper.toDTOWithDetails(updated);
  }
}