export class OrderMapper {

  // ─── Detail mapper ──────────────────────────────────────────────────────────
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

  // ─── Purchase mapper (list view — no details) ───────────────────────────────
  static toDTO(order) {
    if (!order) return null;
    return {
      id:            order.id_purchase,
      invoiceNumber: order.invoice_number,
      purchaseDate:  order.purchase_date,
      totalAmount:   Number(order.total_amount ?? 0),
      providerId:    order.id_provider,
      providerName:  order.providers?.name_provider          ?? null,
      statusId:      order.id_purchase_status,
      status:        order.purchase_statuses?.name_puchase_status ?? null,
    };
  }

  // ─── Purchase mapper with details ───────────────────────────────────────────
  static toDTOWithDetails(order) {
    if (!order) return null;
    return {
      ...OrderMapper.toDTO(order),
      details: (order.purchase_details ?? []).map(OrderMapper.detailToDTO),
    };
  }

  // ─── DB mappers ─────────────────────────────────────────────────────────────
  static toCreateDB(dto) {
    const totalAmount = dto.details.reduce((sum, d) => sum + d.netSubtotal, 0);
    return {
      invoice_number:     dto.invoiceNumber,
      purchase_date:      dto.purchaseDate,
      total_amount:       totalAmount,
      id_provider:        dto.idProvider,
      id_purchase_status: 1, // 1 = Completada
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