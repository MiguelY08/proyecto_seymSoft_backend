// backend/src/modules/supplier-purchases/use-cases/createSupplierPurchaseUsecase.js
import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';
import { notifyAdmins } from '../../../notifications/services/adminNotificationService.js';

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

    // 2 — Proveedor existe y obtener su plazo de devolución
    const provider = await repo.findProviderById(dto.idProvider);
    if (!provider) {
      const error = new Error('Proveedor no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // 3 — Calcular fecha máxima de devolución
    const purchaseDate = new Date(dto.purchaseDate);
    const maxReturnPeriod = provider.max_return_period || 0;
    const maxReturnDate = new Date(purchaseDate);
    maxReturnDate.setDate(maxReturnDate.getDate() + maxReturnPeriod);
    dto.maxReturnDate = maxReturnDate;

    // 4 — Validar cada producto y enriquecer con precios desde la BD
    const enrichedDetails = [];

    for (const detail of dto.details) {
      // 4a — Producto existe
      const product = await repo.findProductById(detail.idProduct);
      if (!product) {
        const error = new Error(`Producto con id ${detail.idProduct} no encontrado.`);
        error.statusCode = 404;
        throw error;
      }

      // 4b — Tiene al menos un barcode
      if (!product.barcodes?.length) {
        const error = new Error(`El producto "${product.name}" no tiene código de barras asignado.`);
        error.statusCode = 422;
        throw error;
      }

      // 4c — extraBarcodes no pertenecen a otro producto
      for (const extraCode of detail.extraBarcodes) {
        const existing = await repo.findBarcodeByCode(extraCode);
        if (existing && existing.id_product !== detail.idProduct) {
          const error = new Error(`El código de barras "${extraCode}" ya pertenece a otro producto.`);
          error.statusCode = 409;
          throw error;
        }
      }

      // 4d — Tomar precios del producto
      const grossUnitPrice = detail.supplierPrice ?? Number(product.wholesale_price);
      const taxPercentage  = Number(product.iva_percentage ?? 0);
      const quantity       = Number(detail.quantity);
      const taxUnitPrice   = +(grossUnitPrice * (taxPercentage / 100)).toFixed(2);
      const netUnitPrice   = +(grossUnitPrice + taxUnitPrice).toFixed(2);
      const grossSubtotal  = +(grossUnitPrice * quantity).toFixed(2);
      const ivaSubtotal    = +(taxUnitPrice   * quantity).toFixed(2);
      const netSubtotal    = +(netUnitPrice   * quantity).toFixed(2);

      // 4e — primaryBarcodeId (el primero ordenado por id_barcode asc)
      const primaryBarcodeId = product.barcodes[0].id_barcode;

      // ========== CALCULAR STOCK A SUMAR ==========
      let stockAdded = Number(detail.quantity);
      if (detail.purchaseType === "X Paca" && detail.quantityPerPack > 0) {
        stockAdded = Number(detail.quantity) * Number(detail.quantityPerPack);
      }

      enrichedDetails.push({
        idProduct:       detail.idProduct,
        primaryBarcodeId,
        quantity:        Number(detail.quantity),
        purchaseType:    detail.purchaseType || "Unidad",
        quantityPerPack: Number(detail.quantityPerPack) || 0,
        stockAdded:      stockAdded,
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
    const purchase = await repo.create(purchaseData, enrichedDetails);
    const mappedPurchase = SupplierPurchaseMapper.toDTOWithDetails(purchase);

    try {
      await notifyAdmins({
        title: 'Nueva compra registrada',
        message: `Se registró la compra ${mappedPurchase.invoiceNumber} a ${mappedPurchase.providerName}.`,
        type: 'purchase',
        actionUrl: '/admin/purchases/supplier-purchases',
        metadata: {
          module: 'purchases',
          idPurchase: mappedPurchase.id,
          invoiceNumber: mappedPurchase.invoiceNumber,
          event: 'purchase_created',
        },
      });
    } catch (notificationError) {
      console.error(
        '[CreateSupplierPurchaseUseCase] Purchase notification error:',
        notificationError.message
      );
    }

    return mappedPurchase;
  }
}
