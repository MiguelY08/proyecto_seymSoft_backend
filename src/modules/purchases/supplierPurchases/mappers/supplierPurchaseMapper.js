export class SupplierPurchaseMapper {

  static detailToDTO(detail) {
    if (!detail) return null;
    return {
      id:             detail.id_purchase_detail,
      idBarcode:      detail.id_barcode,
      barcode:        detail.barcodes?.barcode        ?? null,
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
    };
  }

  static toDTO(purchase) {
    if (!purchase) return null;
    return {
      id:            purchase.id_purchase,
      invoiceNumber: purchase.invoice_number,
      purchaseDate:  purchase.purchase_date,
      totalAmount:   Number(purchase.total_amount ?? 0),
      providerId:    purchase.id_provider,
      providerName:  purchase.providers?.name_provider          ?? null,
      statusId:      purchase.id_purchase_status,
      status:        purchase.purchase_statuses?.name_puchase_status ?? null,
    };
  }

  static toDTOWithDetails(purchase) {
    if (!purchase) return null;
    return {
      ...SupplierPurchaseMapper.toDTO(purchase),
      details: (purchase.purchase_details ?? []).map(SupplierPurchaseMapper.detailToDTO),
    };
  }

  static toCreateDB(dto) {
    const totalAmount = dto.details.reduce((sum, d) => sum + d.netSubtotal, 0);
    return {
      invoice_number:     dto.invoiceNumber,
      purchase_date:      dto.purchaseDate,
      total_amount:       totalAmount,
      id_provider:        dto.idProvider,
      id_purchase_status: 1,
    };
  }

  static detailToCreateDB(detail, purchaseId) {
    return {
      id_purchase:      purchaseId,
      id_barcode:       detail.idBarcode,
      quantity:         detail.quantity,
      gross_unit_price: detail.grossUnitPrice,
      tax_unit_price:   detail.taxUnitPrice,
      net_unit_price:   detail.netUnitPrice,
      gross_subtotal:   detail.grossSubtotal,
      iva_subtotal:     detail.ivaSubtotal,
      net_subtotal:     detail.netSubtotal,
      tax_percentage:   detail.taxPercentage,
      batch_code:       detail.batchCode,
    };
  }
}
