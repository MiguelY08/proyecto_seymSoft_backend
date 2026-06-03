import { mapOrders } from '../mappers/orderMapper.js';

export class GetAllOrdersUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(filters = {}) {
    const orders = await this.repo.findAll(filters);
    return mapOrders(orders);
  }
}