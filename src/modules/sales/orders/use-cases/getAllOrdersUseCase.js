import { mapOrderSummaries } from '../mappers/orderMapper.js';

export class GetAllOrdersUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(filters = {}) {
    // Delegar filtros y paginacion al repository, luego normalizar la lista.
    const result = await this.repo.findAll(filters);

    return {
      orders: mapOrderSummaries(result.orders),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }
}
