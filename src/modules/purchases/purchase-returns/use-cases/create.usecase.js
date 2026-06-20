import {
  RETURN_DETAIL_STATUS_IDS,
  PURCHASE_STATUS_IDS,
  validatePurchaseReturnPeriod,
  validateReturnQuantity,
} from "../helpers/purchaseReturnHelper.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

const getNextPurchaseStatusOnCreate = (currentPurchaseStatusId) => {
  if (
    Number(currentPurchaseStatusId) ===
    PURCHASE_STATUS_IDS.COMPLETED_WITH_ANNULLED_RETURNS
  ) {
    return PURCHASE_STATUS_IDS.RETURN_IN_PROCESS_WITH_ANNULLED_RETURNS;
  }

  return PURCHASE_STATUS_IDS.RETURN_IN_PROCESS;
};

const getBarcodeStock = (purchaseDetail) =>
  Number(purchaseDetail?.barcodes?.stock || 0);

const buildEnrichedDetails = async ({
  idPurchase,
  details,
}) => {
  const enrichedDetails = [];
  const requestedByPurchaseDetail = new Map();
  const requestedByBarcode = new Map();

  for (const detail of details) {
    const purchaseDetail =
      await PurchaseReturnRepository.findRawPurchaseDetailById(
        detail.idPurchaseDetail
      );

    if (!purchaseDetail) {
      return {
        success: false,
        error: `El detalle de compra ${detail.idPurchaseDetail} no existe.`,
        errorCode: "PURCHASE_DETAIL_NOT_FOUND",
      };
    }

    if (Number(purchaseDetail.id_purchase) !== Number(idPurchase)) {
      return {
        success: false,
        error: `El detalle de compra ${detail.idPurchaseDetail} no pertenece a la compra indicada.`,
        errorCode: "PURCHASE_DETAIL_DOES_NOT_BELONG_TO_PURCHASE",
      };
    }

    const alreadyReturned =
      await PurchaseReturnRepository.getReturnedQuantityByPurchaseDetail(
        detail.idPurchaseDetail
      );

    const requestedForDetail =
      requestedByPurchaseDetail.get(
        detail.idPurchaseDetail
      ) || 0;

    const quantityValidation =
      validateReturnQuantity({
        requestedQuantity: detail.quantity,
        purchasedQuantity: purchaseDetail.quantity,
        returnedQuantity:
          alreadyReturned +
          requestedForDetail,
      });

    if (!quantityValidation.success) {
      return {
        success: false,
        error: quantityValidation.error,
        errorCode: quantityValidation.errorCode,
        meta: {
          idPurchaseDetail: detail.idPurchaseDetail,
          availableQuantity:
            quantityValidation.availableQuantity,
        },
      };
    }

    const idBarcode =
      purchaseDetail.id_barcode;

    const requestedForBarcode =
      requestedByBarcode.get(idBarcode) || 0;

    if (
      detail.quantity + requestedForBarcode >
      getBarcodeStock(purchaseDetail)
    ) {
      return {
        success: false,
        error: "La cantidad a devolver supera el stock disponible.",
        errorCode: "INSUFFICIENT_STOCK",
        meta: {
          idBarcode,
          availableStock:
            getBarcodeStock(purchaseDetail) -
            requestedForBarcode,
        },
      };
    }

    requestedByPurchaseDetail.set(
      detail.idPurchaseDetail,
      requestedForDetail + detail.quantity
    );

    requestedByBarcode.set(
      idBarcode,
      requestedForBarcode + detail.quantity
    );

    enrichedDetails.push({
      idPurchaseDetail:
        detail.idPurchaseDetail,
      idBarcode,
      barcode:
        purchaseDetail.barcodes.barcode,
      quantity:
        detail.quantity,
      supplierDate:
        detail.supplierDate ?? null,
      idReturnReason:
        detail.idReturnReason,
      idReturnMethod:
        detail.idReturnMethod,
      idReturnStatus:
        RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
      idProduct:
        purchaseDetail.barcodes.id_product,
    });
  }

  return {
    success: true,
    data: enrichedDetails,
    error: null,
    errorCode: null,
  };
};

export const createPurchaseReturnUseCase = async (data) => {
  try {
    const purchase =
      await PurchaseReturnRepository.findRawPurchaseById(
        data.idPurchase
      );

    if (!purchase) {
      return {
        success: false,
        data: null,
        error: "Compra no encontrada.",
        errorCode: "PURCHASE_NOT_FOUND",
      };
    }

    if (
      Number(purchase.id_purchase_status) ===
      PURCHASE_STATUS_IDS.ANNULLED
    ) {
      return {
        success: false,
        data: null,
        error: "No se puede crear una devolucion para una compra anulada.",
        errorCode: "PURCHASE_ANNULLED",
      };
    }

    const periodValidation =
      validatePurchaseReturnPeriod(purchase);

    if (!periodValidation.success) {
      return {
        success: false,
        data: null,
        error: periodValidation.error,
        errorCode: periodValidation.errorCode,
        meta: periodValidation.meta,
      };
    }

    const enrichedResult =
      await buildEnrichedDetails({
        idPurchase: data.idPurchase,
        details: data.details,
      });

    if (!enrichedResult.success) {
      return {
        success: false,
        data: null,
        error: enrichedResult.error,
        errorCode: enrichedResult.errorCode,
        meta: enrichedResult.meta,
      };
    }

    const created =
      await PurchaseReturnRepository.create({
        idPurchase: data.idPurchase,
        idReturnStatus:
          RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT,
        idPurchaseStatus:
          getNextPurchaseStatusOnCreate(
            purchase.id_purchase_status
          ),
        details: enrichedResult.data,
      });

    return {
      success: true,
      data: created,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[CreatePurchaseReturnUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error creando la devolucion de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const create =
  createPurchaseReturnUseCase;
