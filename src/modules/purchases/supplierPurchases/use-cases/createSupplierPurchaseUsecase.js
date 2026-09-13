// backend/src/modules/supplier-purchases/use-cases/createSupplierPurchaseUsecase.js
import { SupplierPurchaseRepository } from '../repositories/supplierPurchaseRepository.js';
import { SupplierPurchaseMapper }     from '../mappers/supplierPurchaseMapper.js';
import { notifyAdmins } from '../../../notifications/services/adminNotificationService.js';
import { AppError } from '../../../../shared/errors/appError.js';

const repo = new SupplierPurchaseRepository();

export class CreateSupplierPurchaseUseCase {
  async execute(dto) {

    // 1 — Factura única
    const duplicate = await repo.findByInvoiceNumber(dto.invoiceNumber);
    if (duplicate) {
      throw new AppError('Ya existe una compra con ese número de factura.', 409);
    }

    // 2 — Proveedor existe y obtener su plazo de devolución
    const provider = await repo.findProviderById(dto.idProvider);
    if (!provider) {
      throw new AppError('Proveedor no encontrado.', 404);
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
        throw new AppError(`Producto con id ${detail.idProduct} no encontrado.`, 404);
      }

      // 4b — Tiene al menos un barcode
      if (!product.barcodes?.length) {
        throw new AppError(`El producto "${product.name}" no tiene código de barras asignado.`, 422);
      }

      const selectedExtraBarcode = detail.barcode && detail.extraBarcodes.some((extraCode) => (
        (typeof extraCode === 'string' ? extraCode : extraCode.barcode) === detail.barcode
      ));
      if (!detail.idBarcode && detail.barcode && !selectedExtraBarcode) {
        detail.extraBarcodes.push({
          barcode: detail.barcode,
          variantName: 'Estilo pendiente',
          stock: 0,
        });
      }
      if (!detail.idBarcode && detail.barcode) {
        await repo.createExtraBarcodes([detail]);
      }

      // 4c — extraBarcodes no pertenecen a otro producto
      for (const extraCode of detail.extraBarcodes) {
        const barcode = typeof extraCode === 'string' ? extraCode : extraCode.barcode;
        const existing = await repo.findBarcodeByCode(barcode);
        if (existing && existing.id_product !== detail.idProduct) {
          throw new AppError(`El código de barras "${barcode}" ya pertenece a otro producto.`, 409);
        }
      }

      const selectedBarcode = detail.idBarcode
        ? await repo.findBarcodeById(detail.idBarcode)
        : detail.barcode
          ? await repo.findBarcodeByCode(detail.barcode)
          : product.barcodes[0];

      if (!selectedBarcode) {
        throw new AppError('El código de barras seleccionado no existe.', 404);
      }

      if (
        selectedBarcode.id_product !== undefined &&
        selectedBarcode.id_product !== detail.idProduct
      ) {
        throw new AppError('El código de barras seleccionado no pertenece al producto.', 409);
      }

      if (selectedBarcode.is_active === false) {
        throw new AppError('El código de barras seleccionado está inactivo.', 422);
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

      // 4e — conservar exactamente el código seleccionado en el formulario
      const primaryBarcodeId = selectedBarcode.id_barcode;

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
