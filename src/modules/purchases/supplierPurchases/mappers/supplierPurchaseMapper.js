// backend/src/modules/supplier-purchases/mappers/supplierPurchaseMapper.js
export class SupplierPurchaseMapper {
  static #toDateOnly(date) {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return null;
    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  }

  static #canRegisterReturns(maxReturnDate) {
    const limitDate = this.#toDateOnly(maxReturnDate);
    if (!limitDate) return false;
    const today = this.#toDateOnly(new Date());
    return today <= limitDate;
  }

  static detailToDTO(detail) {
    if (!detail) return null;

    const allBarcodes = detail.barcodes?.products?.barcodes ?? [];
    const extraBarcodes = allBarcodes
      .filter((b) => b.id_barcode !== detail.id_barcode)
      .map((b) => b.barcode);
    const returnAvailability = detail.returnAvailability ?? {};
    const purchasedQuantity = returnAvailability.purchasedQuantity ?? detail.stock_added ?? detail.quantity;
    const returnReservedQuantity = returnAvailability.reservedQuantity ?? 0;
    const finalReturnedQuantity = returnAvailability.finalReturnedQuantity ?? 0;
    const returnAvailableQuantity = returnAvailability.availableQuantity ?? detail.stock_added ?? detail.quantity;
    const stockAvailable = Number(detail.barcodes?.stock ?? 0);
    const returnEligibleQuantity = Math.max(
      0,
      Math.min(Number(returnAvailableQuantity), stockAvailable)
    );

    return {
      id:             detail.id_purchase_detail,
      idBarcode:      detail.id_barcode,
      barcode:        detail.barcodes?.barcode ?? null,
      productId:      detail.barcodes?.id_product ?? null,
      productName:    detail.barcodes?.products?.name ?? null,
      quantity:       detail.quantity,
      purchasedQuantity,
      returnReservedQuantity,
      finalReturnedQuantity,
      returnAvailableQuantity,
      returnEligibleQuantity,
      stockAvailable,
      returnAvailability: {
        purchasedQuantity,
        reservedQuantity: returnReservedQuantity,
        finalReturnedQuantity,
        availableQuantity: returnAvailableQuantity,
        eligibleQuantity: returnEligibleQuantity,
      },
      // ========== NUEVOS CAMPOS ==========
      purchaseType:   detail.purchase_type ?? "Unidad",
      quantityPerPack: detail.quantity_per_pack ?? 0,
      stockAdded:     detail.stock_added ?? detail.quantity,
      // ========== FIN NUEVOS CAMPOS ==========
      grossUnitPrice: Number(detail.gross_unit_price),
      taxUnitPrice:   Number(detail.tax_unit_price),
      netUnitPrice:   Number(detail.net_unit_price),
      grossSubtotal:  Number(detail.gross_subtotal),
      ivaSubtotal:    Number(detail.iva_subtotal),
      netSubtotal:    Number(detail.net_subtotal),
      taxPercentage:  Number(detail.tax_percentage),
      batchCode:      detail.batch_code,
      cancellationReason: detail.cancellation_reason ?? null,
      extraBarcodes,
    };
  }

  static toDTO(purchase) {
    if (!purchase) return null;
    return {
      id:               purchase.id_purchase,
      invoiceNumber:    purchase.invoice_number,
      purchaseDate:     purchase.purchase_date,
      totalAmount:      Number(purchase.total_amount ?? 0),
      totalQuantity:    purchase.total_quantity || 0,
      providerId:       purchase.id_provider,
      providerName:     purchase.providers?.name_provider ?? null,
      providerMaxReturnPeriod: purchase.providers?.max_return_period ?? null,
      statusId:         purchase.id_purchase_status,
      status:           purchase.purchase_statuses?.name_puchase_status ?? null,
      maxReturnDate:    purchase.max_return_date,
      canRegisterReturns: SupplierPurchaseMapper.#canRegisterReturns(purchase.max_return_date),
    };
  }

  static toDTOWithDetails(purchase) {
    if (!purchase) return null;
    const details = (purchase.purchase_details ?? []).map(SupplierPurchaseMapper.detailToDTO);

    return {
      ...SupplierPurchaseMapper.toDTO(purchase),
      totalQuantity: purchase.total_quantity ?? details.reduce((sum, detail) => sum + (detail.quantity || 0), 0),
      details,
    };
  }

  static toCreateDB(dto) {
    return {
      invoice_number:     dto.invoiceNumber,
      purchase_date:      dto.purchaseDate,
      total_amount:       dto.details.reduce((sum, d) => sum + d.netSubtotal, 0),
      id_provider:        dto.idProvider,
      id_purchase_status: 1,
      max_return_date:    dto.maxReturnDate,
    };
  }
}
