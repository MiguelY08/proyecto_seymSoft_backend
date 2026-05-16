import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const supplierPurchaseRepository = new SupplierPurchaseRepository();

export class GetAllSupplierPurchasesUseCase {
  async execute({ page, limit, search, startDate, endDate }) {
    const { supplierPurchases, total } = await supplierPurchaseRepository.findAll({
      page, limit, search, startDate, endDate,
    });

    return {
      data:       (supplierPurchases || []).map(SupplierPurchaseMapper.toDTO),
      pagination: {
        page:       page  || 1,
        limit:      limit || 13,
        total:      total || 0,
        totalPages: Math.ceil((total || 0) / (limit || 13)),
      },
    };
  }
}
