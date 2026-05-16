import { OrderRepository } from '../repositories/orderRepository.js';
import { OrderMapper }     from '../mappers/orderMapper.js';

const orderRepository = new OrderRepository();

export class GetAllOrdersUseCase {
  async execute({ page, limit, search, startDate, endDate }) {
    const { orders, total } = await orderRepository.findAll({
      page, limit, search, startDate, endDate,
    });

    return {
      data:       (orders || []).map(OrderMapper.toDTO),
      pagination: {
        page:       page  || 1,
        limit:      limit || 13,
        total:      total || 0,
        totalPages: Math.ceil((total || 0) / (limit || 13)),
      },
    };
  }
}