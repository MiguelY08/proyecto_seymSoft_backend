import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';

const repo = new SupplierPurchaseRepository();

export class CreateSupplierPurchaseUseCase {
  async execute(dto) {

    // 1 — Factura única
    const duplicate = await repo.findByInvoiceNumber(dto.invoiceNumber);
    if (duplicate) {
      const error = new Error('Ya existe una compra con ese número de factura.');
      error.statusCode = 409;
      throw error;
    }

    // 2 — Proveedor existe
    const provider = await repo.findProviderById(dto.idProvider);
    if (!provider) {
      const error = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // 3 — Validar cada producto y enriquecer con precios desde la BD
    const enrichedDetails = [];

    for (const detail of dto.details) {
      // 3a — Producto existe
      const product = await repo.findProductById(detail.idProduct);
      if (!product) {
        const error = new Error(`Producto con id ${detail.idProduct} no encontrado.`);
        error.statusCode = 404;
        throw error;
      }

      // 3b — Tiene al menos un barcode
      if (!product.barcodes?.length) {
        const error = new Error(`El producto "${product.name}" no tiene código de barras asignado.`);
        error.statusCode = 422;
        throw error;
      }

      // 3c — extraBarcodes no pertenecen a otro producto
      for (const extraCode of detail.extraBarcodes) {
        const existing = await repo.findBarcodeByCode(extraCode);
        if (existing && existing.id_product !== detail.idProduct) {
          const error = new Error(`El código de barras "${extraCode}" ya pertenece a otro producto.`);
          error.statusCode = 409;
          throw error;
        }
      }

      // 3d — Tomar precios del producto — forzar Number() para evitar NaN con Decimals de Prisma
      const grossUnitPrice = Number(product.wholesale_price);
      const taxPercentage  = Number(product.iva_percentage ?? 0);
      const quantity       = Number(detail.quantity);
      const taxUnitPrice   = +(grossUnitPrice * (taxPercentage / 100)).toFixed(2);
      const netUnitPrice   = +(grossUnitPrice + taxUnitPrice).toFixed(2);
      const grossSubtotal  = +(grossUnitPrice * quantity).toFixed(2);
      const ivaSubtotal    = +(taxUnitPrice   * quantity).toFixed(2);
      const netSubtotal    = +(netUnitPrice   * quantity).toFixed(2);

      // 3e — primaryBarcodeId (el primero ordenado por id_barcode asc)
      const primaryBarcodeId = product.barcodes[0].id_barcode;

      enrichedDetails.push({
        idProduct:       detail.idProduct,
        primaryBarcodeId,
        quantity,
        extraBarcodes:   detail.extraBarcodes,
        grossUnitPrice,
        taxPercentage,
        taxUnitPrice,
        netUnitPrice,
        grossSubtotal,
        ivaSubtotal,
        netSubtotal,
        batchCode: `LOTE-${detail.idProduct}-${new Date().toISOString().split('T')[0]}`,
      });
    }

    const purchaseData = SupplierPurchaseMapper.toCreateDB({ ...dto, details: enrichedDetails });
    const purchase     = await repo.create(purchaseData, enrichedDetails);
    return SupplierPurchaseMapper.toDTOWithDetails(purchase);
  }
}