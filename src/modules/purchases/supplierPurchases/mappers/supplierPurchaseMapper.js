// backend/src/modules/supplier-purchases/mappers/supplierPurchaseMapper.js
export class SupplierPurchaseMapper {

  // ─── Detail mapper ──────────────────────────────────────────────────────────
  static detailToDTO(detail) {
    if (!detail) return null;

    const allBarcodes = detail.barcodes?.products?.barcodes ?? [];
    const extraBarcodes = allBarcodes
      .filter((b) => b.id_barcode !== detail.id_barcode)
      .map((b) => b.barcode);

    return {
      id:             detail.id_purchase_detail,
      idBarcode:      detail.id_barcode,
      barcode:        detail.barcodes?.barcode        ?? null,
      productId:      detail.barcodes?.id_product     ?? null,
      productName:    detail.barcodes?.products?.name ?? null,
      quantity:       detail.quantity,
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

  // ─── Purchase mapper (list) ─────────────────────────────────────────────────
  static toDTO(purchase) {
    if (!purchase) return null;
    return {
      id:               purchase.id_purchase,
      invoiceNumber:    purchase.invoice_number,
      purchaseDate:     purchase.purchase_date,
      totalAmount:      Number(purchase.total_amount ?? 0),
      totalQuantity:    purchase.total_quantity || 0,
      providerId:       purchase.id_provider,
      providerName:     purchase.providers?.name_provider              ?? null,
      statusId:         purchase.id_purchase_status,
      status:           purchase.purchase_statuses?.name_puchase_status ?? null,
      maxReturnDate:    purchase.max_return_date,
    };
  }

  // ─── Purchase mapper with details ───────────────────────────────────────────
  static toDTOWithDetails(purchase) {
    if (!purchase) return null;
    return {
      ...SupplierPurchaseMapper.toDTO(purchase),
      details: (purchase.purchase_details ?? []).map(SupplierPurchaseMapper.detailToDTO),
    };
  }

  // ─── DB mappers ─────────────────────────────────────────────────────────────
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