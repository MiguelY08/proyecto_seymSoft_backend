// backend/src/modules/supplier-purchases/use-cases/getAllSupplierPurchasesUsecase.js
import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const repo = new SupplierPurchaseRepository();

export class GetAllSupplierPurchasesUseCase {
  async execute({ 
    page, 
    limit, 
    search, 
    startDate, 
    endDate,
    sortField = 'id_purchase',
    sortOrder = 'desc'
  }) {
    const { purchases, total } = await repo.findAll({ 
      page, 
      limit, 
      search, 
      startDate, 
      endDate,
      sortField,
      sortOrder
    });
    return {
      data: (purchases || []).map(SupplierPurchaseMapper.toDTO),
      pagination: {
        page:       page  || 1,
        limit:      limit || 13,
        total:      total || 0,
        totalPages: Math.ceil((total || 0) / (limit || 13)),
      },
    };
  }
}