import { mapOrders } from '../mappers/orderMapper.js';

export class GetAllOrdersUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(filters = {}) {
    // Delegar filtros al repository y normalizar la respuesta con el mapper.
    const orders = await this.repo.findAll(filters);
    return mapOrders(orders);
  }
}
