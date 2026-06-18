import {
  validatePurchaseReturnPeriod,
} from "../helpers/purchaseReturnHelper.js";

export class PurchaseReturnMapper {
  static toReturnStatus(status) {
    if (!status) return null;

    return {
      id: status.id_return_status,
      name: status.name_status,
      purchaseDescription: status.purchase_description ?? null,
      salesDescription: status.sales_description ?? null,
    };
  }

  static toReturnMethod(method) {
    if (!method) return null;

    return {
      id: method.id_return_method,
      description: method.description,
    };
  }

  static toReturnReason(reason) {
    if (!reason) return null;

    return {
      id: reason.id_return_reason,
      description: reason.description,
    };
  }

  static toProduct(product) {
    if (!product) return null;

    return {
      id: product.id_product,
      name: product.name,
      reference: product.reference,
    };
  }

  static toBarcode(barcode) {
    if (!barcode) return null;

    return {
      id: barcode.id_barcode,
      code: barcode.barcode,
      type: barcode.barcode_type ?? null,
      stock: barcode.stock ?? 0,
      productId: barcode.id_product,
      product: this.toProduct(barcode.products),
    };
  }

  static toPurchaseDetail(detail) {
    if (!detail) return null;

    return {
      id: detail.id_purchase_detail,
      purchaseId: detail.id_purchase,
      barcodeId: detail.id_barcode,
      quantity: detail.quantity,
      grossUnitPrice: detail.gross_unit_price,
      taxUnitPrice: detail.tax_unit_price,
      netUnitPrice: detail.net_unit_price,
      grossSubtotal: detail.gross_subtotal,
      ivaSubtotal: detail.iva_subtotal,
      netSubtotal: detail.net_subtotal,
      taxPercentage: detail.tax_percentage,
      batchCode: detail.batch_code,
      cancellationReason: detail.cancellation_reason ?? null,
      barcode: this.toBarcode(detail.barcodes),
    };
  }

  static toProvider(provider) {
    if (!provider) return null;

    return {
      id: provider.id_provider,
      name: provider.name_provider,
      lastname: provider.lastname ?? null,
      email: provider.email ?? null,
      phone: provider.phone ?? null,
      documentType: provider.document_type ?? null,
      documentNumber: provider.document_number ?? null,
      maxReturnPeriod: provider.max_return_period ?? null,
      nit: provider.nit ?? null,
    };
  }

  static toPurchaseStatus(status) {
    if (!status) return null;

    return {
      id: status.id_purchase_status,
      name: status.name_puchase_status,
    };
  }

  static toPurchase(purchase) {
    if (!purchase) return null;

    const returnPeriod =
      validatePurchaseReturnPeriod(purchase);

    return {
      id: purchase.id_purchase,
      invoiceNumber: purchase.invoice_number,
      purchaseDate: purchase.purchase_date,
      maxReturnDate:
        returnPeriod.meta?.maxReturnDate ??
        purchase.max_return_date ??
        null,
      canRegisterReturns: returnPeriod.success,
      returnPeriodStatus: {
        success: returnPeriod.success,
        errorCode: returnPeriod.errorCode,
        message: returnPeriod.error,
      },
      totalAmount: purchase.total_amount,
      providerId: purchase.id_provider,
      statusId: purchase.id_purchase_status,
      provider: this.toProvider(purchase.providers),
      status: this.toPurchaseStatus(purchase.purchase_statuses),
      details: purchase.purchase_details?.map((detail) =>
        this.toPurchaseDetail(detail)
      ) ?? [],
    };
  }

  static toPurchaseReturnDetail(detail) {
    if (!detail) return null;

    return {
      id: detail.id_purchase_return_details,
      purchaseReturnId: detail.id_purchase_return,
      purchaseDetailId: detail.id_purchase_detail,
      barcode: detail.barcode,
      quantity: detail.quantity,
      supplierDate: detail.supplier_date ?? null,
      returnReasonId: detail.id_return_reason,
      returnMethodId: detail.id_return_method,
      returnStatusId: detail.id_return_status,
      productId: detail.id_product,
      reason: this.toReturnReason(detail.return_reasons),
      method: this.toReturnMethod(detail.return_methods),
      status: this.toReturnStatus(detail.return_statuses),
      product: this.toProduct(detail.products),
      purchaseDetail: this.toPurchaseDetail(detail.purchase_details),
      statusHistory: detail.prsh?.map((history) =>
        this.toDetailStatusHistory(history)
      ) ?? [],
    };
  }

  static toDetailStatusHistory(history) {
    if (!history) return null;

    return {
      id: history.id_status_history,
      detailId: history.id_detail,
      status: history.status,
      statusDate: history.status_date,
    };
  }

  static toPurchaseReturnStatusHistory(history) {
    if (!history) return null;

    return {
      id: history.id_history_status_purchase,
      purchaseReturnId: history.id_purchase_return,
      purchaseStatusId: history.id_purchase_status,
      statusDate: history.status_date,
      purchaseDetailId: history.id_purchase_detail,
    };
  }

  static toReturnStatusSummary(status) {
    if (!status) return null;

    return {
      id: status.id_return_status,
      name: status.name_status,
    };
  }

  static toPurchaseSummary(purchase) {
    if (!purchase) return null;

    const returnPeriod =
      validatePurchaseReturnPeriod(purchase);

    return {
      id: purchase.id_purchase,
      invoiceNumber: purchase.invoice_number,
      purchaseDate: purchase.purchase_date,
      maxReturnDate:
        returnPeriod.meta?.maxReturnDate ??
        purchase.max_return_date ??
        null,
      canRegisterReturns: returnPeriod.success,
      returnPeriodStatus: {
        success: returnPeriod.success,
        errorCode: returnPeriod.errorCode,
        message: returnPeriod.error,
      },
      totalAmount: purchase.total_amount,
      statusId: purchase.id_purchase_status,
      status: purchase.purchase_statuses?.name_puchase_status ?? null,
      provider: purchase.providers
        ? {
            id: purchase.providers.id_provider,
            name: purchase.providers.name_provider,
            maxReturnPeriod:
              purchase.providers.max_return_period ?? null,
          }
        : null,
    };
  }

  static toPurchaseReturnDetailSummary(detail) {
    if (!detail) return null;

    return {
      id: detail.id_purchase_return_details,
      purchaseReturnId: detail.id_purchase_return,
      purchaseDetailId: detail.id_purchase_detail,
      barcode: detail.barcode,
      barcodeId:
        detail.purchase_details?.id_barcode ?? null,
      quantity: detail.quantity,
      supplierDate: detail.supplier_date ?? null,
      returnReasonId: detail.id_return_reason,
      reason:
        detail.return_reasons?.description ?? null,
      returnMethodId: detail.id_return_method,
      method:
        detail.return_methods?.description ?? null,
      returnStatusId: detail.id_return_status,
      status:
        detail.return_statuses?.name_status ?? null,
      product: this.toProduct(detail.products),
      stock:
        detail.purchase_details?.barcodes?.stock ?? null,
      statusHistory: detail.prsh?.map((history) =>
        this.toDetailStatusHistory(history)
      ) ?? [],
    };
  }

  static getProgress(details = []) {
    const total = details.length;
    const completed = details.filter(
      (detail) =>
        detail.return_statuses?.name_status === "Listo" ||
        Number(detail.id_return_status) === 4
    ).length;

    return {
      completed,
      total,
      label: `${completed}/${total}`,
    };
  }

  static toResponse(purchaseReturn) {
    if (!purchaseReturn) return null;

    const details = purchaseReturn.prd ?? [];
    const progress = this.getProgress(details);

    return {
      id: purchaseReturn.id_purchase_return,
      purchaseId: purchaseReturn.id_purchase,
      creationDate: purchaseReturn.creation_date,
      returnStatusId: purchaseReturn.id_return_status,
      status: this.toReturnStatus(purchaseReturn.return_statuses),
      progress,
      purchase: this.toPurchase(purchaseReturn.purchases),
      details: details.map((detail) => this.toPurchaseReturnDetail(detail)),
      statusHistory: purchaseReturn.hsp?.map((history) =>
        this.toPurchaseReturnStatusHistory(history)
      ) ?? [],
    };
  }

  static toDetailResponse(purchaseReturn) {
    if (!purchaseReturn) return null;

    const details = purchaseReturn.prd ?? [];
    const progress = this.getProgress(details);

    return {
      id: purchaseReturn.id_purchase_return,
      purchaseId: purchaseReturn.id_purchase,
      creationDate: purchaseReturn.creation_date,
      returnStatusId: purchaseReturn.id_return_status,
      status: this.toReturnStatusSummary(
        purchaseReturn.return_statuses
      ),
      progress,
      purchase: this.toPurchaseSummary(
        purchaseReturn.purchases
      ),
      details: details.map((detail) =>
        this.toPurchaseReturnDetailSummary(detail)
      ),
      statusHistory: purchaseReturn.hsp?.map((history) =>
        this.toPurchaseReturnStatusHistory(history)
      ) ?? [],
    };
  }

  static toListResponse(purchaseReturn) {
    if (!purchaseReturn) return null;

    const details = purchaseReturn.prd ?? [];
    const progress = this.getProgress(details);

    return {
      id: purchaseReturn.id_purchase_return,
      purchaseId: purchaseReturn.id_purchase,
      invoiceNumber: purchaseReturn.purchases?.invoice_number ?? null,
      creationDate: purchaseReturn.creation_date,
      statusId: purchaseReturn.id_return_status,
      status: purchaseReturn.return_statuses?.name_status ?? null,
      progress,
      provider: purchaseReturn.purchases?.providers
        ? {
            id: purchaseReturn.purchases.providers.id_provider,
            name: purchaseReturn.purchases.providers.name_provider,
          }
        : null,
      totalDetails: progress.total,
      completedDetails: progress.completed,
    };
  }
}
