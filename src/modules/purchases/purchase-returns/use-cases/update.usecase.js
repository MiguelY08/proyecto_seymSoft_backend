import {
  RETURN_DETAIL_STATUS_IDS,
  validateDetailIsEditable,
  validateDetailStatusTransition,
  validatePurchaseReturnPeriod,
  validateReturnQuantity,
  shouldRestoreStockOnReady,
} from "../helpers/purchaseReturnHelper.js";
import { validateReturnCatalogReferences } from "../helpers/validateReturnCatalogReferences.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

const getBarcodeStock = (purchaseDetail) =>
  Number(purchaseDetail?.barcodes?.stock || 0);

const createEmptyChangeset = ({
  idPurchaseReturn,
  idPurchase,
}) => ({
  idPurchaseReturn,
  idPurchase,
  detailStatusUpdates: [],
  detailsToAdd: [],
  stockIncrements: [],
  stockDecrements: [],
});

const buildDetailsToAdd = async ({
  idPurchase,
  details,
}) => {
  const enrichedDetails = [];
  const requestedByPurchaseDetail = new Map();
  const requestedByBarcode = new Map();

  for (const detail of details) {
    const catalogValidation =
      await validateReturnCatalogReferences(detail);

    if (!catalogValidation.success) {
      return catalogValidation;
    }

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

    const requestedForDetail =
      requestedByPurchaseDetail.get(
        detail.idPurchaseDetail
      ) || 0;

    const returnAvailability =
      await PurchaseReturnRepository.getReturnAvailabilityByPurchaseDetail(
        detail.idPurchaseDetail
      );

    const quantityValidation =
      validateReturnQuantity({
        requestedQuantity: detail.quantity,
        purchasedQuantity:
          returnAvailability.purchasedQuantity,
        returnedQuantity:
          returnAvailability.reservedQuantity +
          returnAvailability.finalReturnedQuantity +
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

    const enrichedDetail = {
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
    };

    enrichedDetails.push(enrichedDetail);
  }

  return {
    success: true,
    data: enrichedDetails,
    error: null,
    errorCode: null,
  };
};

const buildDetailsToUpdate = async ({
  idPurchaseReturn,
  detailsToUpdate,
}) => {
  const validatedDetails = [];

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

    const shouldRestoreStock =
      shouldRestoreStockOnReady({
        idReturnMethod:
          currentDetail.id_return_method,
        currentStatusId:
          currentDetail.id_return_status,
        nextStatusId:
          detail.idReturnStatus,
      });

    validatedDetails.push({
      idPurchaseReturnDetail:
        detail.idPurchaseReturnDetail,
      idReturnStatus:
        detail.idReturnStatus,
      currentDetail,
      stockIncrement: shouldRestoreStock
        ? {
            idBarcode:
              currentDetail.purchase_details.id_barcode,
            quantity:
              currentDetail.quantity,
          }
        : null,
    });
  }

  return {
    success: true,
    data: validatedDetails,
    error: null,
    errorCode: null,
  };
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

    if (detailsToAdd.length > 0) {
      const periodValidation =
        validatePurchaseReturnPeriod(
          currentReturn.purchases
        );

      if (!periodValidation.success) {
        return {
          success: false,
          data: null,
          error: periodValidation.error,
          errorCode: periodValidation.errorCode,
          meta: periodValidation.meta,
        };
      }
    }

    const changeset =
      createEmptyChangeset({
        idPurchaseReturn,
        idPurchase: currentReturn.id_purchase,
      });

    if (detailsToUpdate.length > 0) {
      const updateResult =
        await buildDetailsToUpdate({
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

      changeset.detailStatusUpdates =
        updateResult.data;

      changeset.stockIncrements =
        updateResult.data
          .map((detail) => detail.stockIncrement)
          .filter(Boolean);
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

      changeset.detailsToAdd =
        addResult.data;

      changeset.stockDecrements =
        addResult.data.map((detail) => ({
          idBarcode: detail.idBarcode,
          quantity: detail.quantity,
        }));
    }

    const updatedReturn =
      await PurchaseReturnRepository.applyUpdateChangeset(
        changeset
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

    if (error.errorCode) {
      return {
        success: false,
        data: null,
        error: error.message,
        errorCode: error.errorCode,
        ...(error.meta && {
          meta: error.meta,
        }),
      };
    }

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
