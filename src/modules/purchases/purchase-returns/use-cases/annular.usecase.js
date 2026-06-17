import {
  PURCHASE_STATUS_IDS,
  RETURN_DETAIL_STATUS_IDS,
  RETURN_METHOD_IDS,
  RETURN_LIFECYCLE,
  calculatePurchaseStatusFromReturns,
} from "../helpers/purchaseReturnHelper.js";
import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

const ANNULLED_RETURN_STATUS_NAME = "Anulada";

const shouldRestoreStockOnAnnul = (detail) => {
  const isReplacementReady =
    Number(detail.id_return_method) ===
      RETURN_METHOD_IDS.REPLACEMENT &&
    Number(detail.id_return_status) ===
      RETURN_DETAIL_STATUS_IDS.READY;

  return !isReplacementReady;
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

export const annularPurchaseReturnUseCase = async ({
  idPurchaseReturn,
  cancellationReason,
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
      currentReturn.return_statuses?.name_status ===
      ANNULLED_RETURN_STATUS_NAME
    ) {
      return {
        success: false,
        data: null,
        error: "La devolucion de compra ya se encuentra anulada.",
        errorCode: "PURCHASE_RETURN_ALREADY_ANNULLED",
      };
    }

    const annulledStatus =
      await PurchaseReturnRepository.findReturnStatusByName(
        ANNULLED_RETURN_STATUS_NAME
      );

    if (!annulledStatus) {
      return {
        success: false,
        data: null,
        error: "No existe el estado Anulada para devoluciones.",
        errorCode: "RETURN_STATUS_NOT_FOUND",
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

    const cancelled =
      await PurchaseReturnRepository.cancelPurchaseReturn({
        idPurchaseReturn,
        idReturnStatus:
          annulledStatus.id_return_status,
        cancellationReason,
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
