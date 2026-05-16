import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const supplierPurchaseRepository = new SupplierPurchaseRepository();

export class CreateSupplierPurchaseUseCase {
  async execute(dto) {
    const duplicate = await supplierPurchaseRepository.findByInvoiceNumber(dto.invoiceNumber);
    if (duplicate) {
      const error = new Error('Ya existe una compra con ese número de factura.');
      error.statusCode = 409;
      throw error;
    }

    const provider = await supplierPurchaseRepository.findProviderById(dto.idProvider);
    if (!provider) {
      const error = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    for (const detail of dto.details) {
      const barcode = await supplierPurchaseRepository.findBarcodeById(detail.idBarcode);
      if (!barcode) {
        const error = new Error(`Código de barras con id ${detail.idBarcode} no encontrado.`);
        error.statusCode = 404;
        throw error;
      }
    }

    const purchaseData = SupplierPurchaseMapper.toCreateDB(dto);
    const purchase     = await supplierPurchaseRepository.create(purchaseData, dto.details);

    return SupplierPurchaseMapper.toDTOWithDetails(purchase);
  }
}
