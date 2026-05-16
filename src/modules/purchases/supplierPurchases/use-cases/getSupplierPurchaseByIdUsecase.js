import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const supplierPurchaseRepository = new SupplierPurchaseRepository();

export class GetSupplierPurchaseByIdUseCase {
  async execute(id) {
    const purchase = await supplierPurchaseRepository.findById(id);

    if (!purchase) {
      const error = new Error('Compra no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    return SupplierPurchaseMapper.toDTOWithDetails(purchase);
  }
}
