import {
  PURCHASE_STATUS_IDS,
  RETURN_DETAIL_STATUS_IDS,
  RETURN_METHOD_IDS,
  RETURN_LIFECYCLE,
  calculatePurchaseStatusFromReturns,
} from "../helpers/purchaseReturnHelper.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

export const shouldRestoreStockOnAnnul = (detail) => {
  const isReplacementReady =
    Number(detail.id_return_method) ===
      RETURN_METHOD_IDS.REPLACEMENT &&
    Number(detail.id_return_status) ===
      RETURN_DETAIL_STATUS_IDS.READY;

  const isSupplierRejected =
    Number(detail.id_return_status) ===
    RETURN_DETAIL_STATUS_IDS.SUPPLIER_REJECTION;

  return !isReplacementReady && !isSupplierRejected;
};

const calculateNextPurchaseStatus = ({
  currentReturn,
  purchaseReturns,
}) => {
  const returnsForStatus =
    purchaseReturns.map((purchaseReturn) => {
      if (
        Number(purchaseReturn.id_purchase_return) ===
        Number(currentReturn.id_purchase_return)
      ) {
        return {
          ...purchaseReturn,
          lifecycle: RETURN_LIFECYCLE.ANNULLED,
        };
      }

      return purchaseReturn;
    });

  return calculatePurchaseStatusFromReturns(
    returnsForStatus
  );
};

const normalizeUserId = (idUser) => {
  const parsedId = Number(idUser);
  return Number.isInteger(parsedId) && parsedId > 0
    ? parsedId
    : null;
};

const toAuditDetail = (detail) => ({
  idPurchaseReturnDetail:
    detail.id_purchase_return_details,
  idPurchaseDetail:
    detail.id_purchase_detail,
  idBarcode:
    detail.purchase_details?.id_barcode ?? null,
  quantity:
    detail.quantity,
  returnMethodId:
    detail.id_return_method,
  previousReturnStatus:
    detail.id_return_status,
});

const buildAnnulmentAuditLog = ({
  currentReturn,
  cancellationReason,
  cancelledBy,
  nextPurchaseStatus,
  detailsToRestore,
}) => ({
  idUser: cancelledBy,
  action: "ANNUL_PURCHASE_RETURN",
  previousReturnStatus:
    currentReturn.id_return_status,
  newReturnStatus:
    RETURN_DETAIL_STATUS_IDS.ANNULLED,
  reason:
    cancellationReason,
  metadata: {
    idPurchase:
      currentReturn.id_purchase,
    nextPurchaseStatus,
    details:
      currentReturn.prd.map(toAuditDetail),
    detailsToRestoreStock:
      detailsToRestore.map(toAuditDetail),
  },
});

export const annularPurchaseReturnUseCase = async ({
  idPurchaseReturn,
  cancellationReason,
  cancelledBy,
}) => {
  try {
    if (!cancellationReason?.trim()) {
      return {
        success: false,
        data: null,
        error: "El motivo de anulacion es obligatorio.",
        errorCode: "ANNULMENT_REASON_REQUIRED",
      };
    }

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
      Number(currentReturn.id_return_status) ===
      RETURN_DETAIL_STATUS_IDS.ANNULLED
    ) {
      return {
        success: false,
        data: null,
        error: "La devolucion de compra ya se encuentra anulada.",
        errorCode: "PURCHASE_RETURN_ALREADY_ANNULLED",
      };
    }

    const purchaseReturns =
      await PurchaseReturnRepository.findRawByPurchaseId(
        currentReturn.id_purchase
      );

    const nextPurchaseStatus =
      calculateNextPurchaseStatus({
        currentReturn,
        purchaseReturns,
      });

    const detailsToRestore =
      currentReturn.prd.filter(
        shouldRestoreStockOnAnnul
      );

    const normalizedCancelledBy =
      normalizeUserId(cancelledBy);

    const auditLog =
      buildAnnulmentAuditLog({
        currentReturn,
        cancellationReason,
        cancelledBy: normalizedCancelledBy,
        nextPurchaseStatus:
          nextPurchaseStatus ||
          PURCHASE_STATUS_IDS.COMPLETED_WITH_ANNULLED_RETURNS,
        detailsToRestore,
      });

    const cancelled =
      await PurchaseReturnRepository.cancelPurchaseReturn({
        idPurchaseReturn,
        idReturnStatus:
          RETURN_DETAIL_STATUS_IDS.ANNULLED,
        cancellationReason,
        cancelledBy: normalizedCancelledBy,
        auditLog,
        idPurchaseStatus:
          nextPurchaseStatus ||
          PURCHASE_STATUS_IDS.COMPLETED_WITH_ANNULLED_RETURNS,
        detailsToRestore,
      });

    return {
      success: true,
      data: cancelled,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[AnnularPurchaseReturnUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error anulando la devolucion de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const annular =
  annularPurchaseReturnUseCase;
