import {
  RETURN_DETAIL_STATUS_IDS,
  calculatePurchaseStatusFromReturns,
  calculateReturnLifecycle,
  validateDetailIsEditable,
  validateDetailStatusTransition,
  validateReturnQuantity,
  shouldRestoreStockOnReady,
  RETURN_LIFECYCLE,
} from "../helpers/purchaseReturnHelper.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

const getHeaderStatusFromLifecycle = (lifecycle) =>
  lifecycle === RETURN_LIFECYCLE.COMPLETED
    ? RETURN_DETAIL_STATUS_IDS.READY
    : RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT;

const getBarcodeStock = (purchaseDetail) =>
  Number(purchaseDetail?.barcodes?.stock || 0);

const buildDetailsToAdd = async ({
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
        error: `El detalle de compra ${detail.idPurchaseDetail} no pertenece a la compra de la devolucion.`,
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

const updateDetailStatuses = async ({
  idPurchaseReturn,
  detailsToUpdate,
}) => {
  for (const detail of detailsToUpdate) {
    const currentDetail =
      await PurchaseReturnRepository.findRawReturnDetailById(
        detail.idPurchaseReturnDetail
      );

    if (!currentDetail) {
      return {
        success: false,
        error: `El detalle de devolucion ${detail.idPurchaseReturnDetail} no existe.`,
        errorCode: "PURCHASE_RETURN_DETAIL_NOT_FOUND",
      };
    }

    if (
      Number(currentDetail.id_purchase_return) !==
      Number(idPurchaseReturn)
    ) {
      return {
        success: false,
        error: `El detalle de devolucion ${detail.idPurchaseReturnDetail} no pertenece a esta devolucion.`,
        errorCode: "PURCHASE_RETURN_DETAIL_DOES_NOT_BELONG_TO_RETURN",
      };
    }

    const editableValidation =
      validateDetailIsEditable(currentDetail);

    if (!editableValidation.success) {
      return editableValidation;
    }

    const transitionValidation =
      validateDetailStatusTransition({
        idReturnMethod:
          currentDetail.id_return_method,
        currentStatusId:
          currentDetail.id_return_status,
        nextStatusId:
          detail.idReturnStatus,
      });

    if (!transitionValidation.success) {
      return transitionValidation;
    }

    if (
      shouldRestoreStockOnReady({
        idReturnMethod:
          currentDetail.id_return_method,
        currentStatusId:
          currentDetail.id_return_status,
        nextStatusId:
          detail.idReturnStatus,
      })
    ) {
      await PurchaseReturnRepository.incrementBarcodeStock(
        currentDetail.purchase_details.id_barcode,
        currentDetail.quantity
      );
    }

    await PurchaseReturnRepository.updateDetailStatus(
      detail.idPurchaseReturnDetail,
      detail.idReturnStatus
    );
  }

  return {
    success: true,
    error: null,
    errorCode: null,
  };
};

const recalculateStatuses = async (idPurchaseReturn) => {
  const updatedRawReturn =
    await PurchaseReturnRepository.findRawById(
      idPurchaseReturn
    );

  const lifecycle =
    calculateReturnLifecycle({
      details: updatedRawReturn.prd,
    });

  await PurchaseReturnRepository.updateReturnStatus(
    idPurchaseReturn,
    getHeaderStatusFromLifecycle(lifecycle)
  );

  const purchaseReturns =
    await PurchaseReturnRepository.findRawByPurchaseId(
      updatedRawReturn.id_purchase
    );

  const nextPurchaseStatus =
    calculatePurchaseStatusFromReturns(
      purchaseReturns
    );

  await PurchaseReturnRepository.updatePurchaseStatus(
    updatedRawReturn.id_purchase,
    nextPurchaseStatus
  );

  return PurchaseReturnRepository.findById(
    idPurchaseReturn
  );
};

export const updatePurchaseReturnUseCase = async ({
  idPurchaseReturn,
  detailsToUpdate = [],
  detailsToAdd = [],
}) => {
  try {
    const currentReturn =
      await PurchaseReturnRepository.findRawById(
        idPurchaseReturn
      );

    if (!currentReturn) {
      return {
        success: false,
        data: null,
        error: "Devolucion de compra no encontrada.",
        errorCode: "PURCHASE_RETURN_NOT_FOUND",
      };
    }

    if (
      currentReturn.return_statuses?.name_status ===
      "Anulada"
    ) {
      return {
        success: false,
        data: null,
        error: "Una devolucion anulada no permite modificaciones.",
        errorCode: "PURCHASE_RETURN_ANNULLED",
      };
    }

    if (detailsToUpdate.length > 0) {
      const updateResult =
        await updateDetailStatuses({
          idPurchaseReturn,
          detailsToUpdate,
        });

      if (!updateResult.success) {
        return {
          success: false,
          data: null,
          error: updateResult.error,
          errorCode: updateResult.errorCode,
          ...(updateResult.allowedNextStatuses && {
            meta: {
              allowedNextStatuses:
                updateResult.allowedNextStatuses,
            },
          }),
        };
      }
    }

    if (detailsToAdd.length > 0) {
      const addResult =
        await buildDetailsToAdd({
          idPurchase: currentReturn.id_purchase,
          details: detailsToAdd,
        });

      if (!addResult.success) {
        return {
          success: false,
          data: null,
          error: addResult.error,
          errorCode: addResult.errorCode,
          meta: addResult.meta,
        };
      }

      await PurchaseReturnRepository.addDetails(
        idPurchaseReturn,
        addResult.data
      );
    }

    const updatedReturn =
      await recalculateStatuses(
        idPurchaseReturn
      );

    return {
      success: true,
      data: updatedReturn,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[UpdatePurchaseReturnUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error actualizando la devolucion de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const update =
  updatePurchaseReturnUseCase;
