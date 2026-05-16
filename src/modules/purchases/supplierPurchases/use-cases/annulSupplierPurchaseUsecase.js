import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const supplierPurchaseRepository = new SupplierPurchaseRepository();

export class AnnulSupplierPurchaseUseCase {
  async execute(id, dto) {
    const existing = await supplierPurchaseRepository.findById(id);

    if (!existing) {
      const error = new Error('Compra no encontrada.');
      error.statusCode = 404;
      throw error;
    }

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

    const updated = await supplierPurchaseRepository.annul(id, dto.cancellationReason);
    return SupplierPurchaseMapper.toDTOWithDetails(updated);
  }
}
