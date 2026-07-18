import {
  PURCHASE_STATUSES,
  RETURN_METHODS,
  RETURN_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";

export const RETURN_DETAIL_STATUS_IDS = {
  PENDING_SHIPMENT: RETURN_STATUSES[1].id,
  PENDING_REPLACEMENT: RETURN_STATUSES[2].id,
  PENDING_REFUND: RETURN_STATUSES[3].id,
  READY: RETURN_STATUSES[4].id,
  ANNULLED: RETURN_STATUSES[5].id,
};

export const RETURN_METHOD_IDS = {
  REPLACEMENT: RETURN_METHODS[1].id,
  REFUND: RETURN_METHODS[2].id,
  CREDIT_BALANCE: RETURN_METHODS[3].id,
};

export const PURCHASE_STATUS_IDS = {
  COMPLETED: PURCHASE_STATUSES[1].id,
  RETURN_IN_PROCESS: PURCHASE_STATUSES[2].id,
  ANNULLED: PURCHASE_STATUSES[3].id,
  COMPLETED_WITH_RETURNS: PURCHASE_STATUSES[4].id,
  COMPLETED_WITH_ANNULLED_RETURNS: PURCHASE_STATUSES[5].id,
  RETURN_IN_PROCESS_WITH_ANNULLED_RETURNS: PURCHASE_STATUSES[6].id,
};

export const RETURN_LIFECYCLE = {
  IN_PROCESS: "IN_PROCESS",
  COMPLETED: "COMPLETED",
  ANNULLED: "ANNULLED",
};

const DETAIL_STATUS_FLOW_BY_METHOD = {
  [RETURN_METHOD_IDS.REPLACEMENT]: {
    [RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT]: [
      RETURN_DETAIL_STATUS_IDS.PENDING_REPLACEMENT,
    ],
    [RETURN_DETAIL_STATUS_IDS.PENDING_REPLACEMENT]: [
      RETURN_DETAIL_STATUS_IDS.READY,
    ],
  },
  [RETURN_METHOD_IDS.REFUND]: {
    [RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT]: [
      RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    ],
    [RETURN_DETAIL_STATUS_IDS.PENDING_REFUND]: [
      RETURN_DETAIL_STATUS_IDS.READY,
    ],
  },
  [RETURN_METHOD_IDS.CREDIT_BALANCE]: {
    [RETURN_DETAIL_STATUS_IDS.PENDING_SHIPMENT]: [
      RETURN_DETAIL_STATUS_IDS.PENDING_REFUND,
    ],
    [RETURN_DETAIL_STATUS_IDS.PENDING_REFUND]: [
      RETURN_DETAIL_STATUS_IDS.READY,
    ],
  },
};

const toNumber = (value) => Number(value || 0);

const toDateOnly = (date) => {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
};

export const getPurchaseMaxReturnDate = (purchase) => {
  const maxReturnDate =
    toDateOnly(purchase?.max_return_date);

  if (maxReturnDate) return maxReturnDate;

  const purchaseDate =
    toDateOnly(purchase?.purchase_date);
  const maxReturnPeriod =
    purchase?.providers?.max_return_period;

  if (
    !purchaseDate ||
    maxReturnPeriod === null ||
    maxReturnPeriod === undefined
  ) {
    return null;
  }

  return addDays(
    purchaseDate,
    maxReturnPeriod
  );
};

export const validatePurchaseReturnPeriod = (
  purchase,
  currentDate = new Date()
) => {
  const maxReturnDate =
    getPurchaseMaxReturnDate(purchase);

  if (!maxReturnDate) {
    return {
      success: false,
      errorCode: "PURCHASE_RETURN_PERIOD_NOT_CONFIGURED",
      error: "La compra no tiene configurado un periodo valido para registrar devoluciones.",
      meta: {
        purchaseDate: purchase?.purchase_date ?? null,
        maxReturnDate: purchase?.max_return_date ?? null,
        maxReturnPeriod:
          purchase?.providers?.max_return_period ?? null,
      },
    };
  }

  const today = toDateOnly(currentDate);

  if (today > maxReturnDate) {
    return {
      success: false,
      errorCode: "PURCHASE_RETURN_PERIOD_EXPIRED",
      error: "El periodo permitido para registrar devoluciones de esta compra ya vencio.",
      meta: {
        currentDate: today,
        maxReturnDate,
        purchaseDate: purchase?.purchase_date ?? null,
        maxReturnPeriod:
          purchase?.providers?.max_return_period ?? null,
      },
    };
  }

  return {
    success: true,
    errorCode: null,
    error: null,
    meta: {
      currentDate: today,
      maxReturnDate,
      purchaseDate: purchase?.purchase_date ?? null,
      maxReturnPeriod:
        purchase?.providers?.max_return_period ?? null,
    },
  };
};

export const calculateAvailableQuantity = ({
  purchasedQuantity,
  returnedQuantity = 0,
}) => {
  const available =
    toNumber(purchasedQuantity) -
    toNumber(returnedQuantity);

  return Math.max(available, 0);
};

export const isAnnulledStatus = (idReturnStatus) =>
  Number(idReturnStatus) === RETURN_DETAIL_STATUS_IDS.ANNULLED;

export const isFinalDeductibleReturnMethod = (idReturnMethod) =>
  [
    RETURN_METHOD_IDS.REFUND,
    RETURN_METHOD_IDS.CREDIT_BALANCE,
  ].includes(Number(idReturnMethod));

export const calculatePurchaseDetailReturnAvailability = ({
  purchasedQuantity,
  returnDetails = [],
}) => {
  const initial = {
    purchasedQuantity: toNumber(purchasedQuantity),
    reservedQuantity: 0,
    finalReturnedQuantity: 0,
  };

  const totals = returnDetails.reduce((acc, detail) => {
    const quantity = toNumber(detail.quantity);
    const idReturnStatus = Number(
      detail.id_return_status ??
      detail.returnStatusId ??
      detail.idReturnStatus
    );
    const idReturnMethod = Number(
      detail.id_return_method ??
      detail.returnMethodId ??
      detail.idReturnMethod
    );

    if (quantity <= 0 || isAnnulledStatus(idReturnStatus)) {
      return acc;
    }

    if (!isReadyStatus(idReturnStatus)) {
      acc.reservedQuantity += quantity;
      return acc;
    }

    if (isFinalDeductibleReturnMethod(idReturnMethod)) {
      acc.finalReturnedQuantity += quantity;
    }

    return acc;
  }, initial);

  const availableQuantity =
    totals.purchasedQuantity -
    totals.reservedQuantity -
    totals.finalReturnedQuantity;

  return {
    ...totals,
    availableQuantity: Math.max(availableQuantity, 0),
  };
};

export const calculatePurchaseDetailsReturnAvailability = ({
  purchaseDetails = [],
  returnDetails = [],
}) => {
  const returnDetailsByPurchaseDetail =
    returnDetails.reduce((grouped, detail) => {
      const idPurchaseDetail = Number(
        detail.id_purchase_detail ??
        detail.purchaseDetailId ??
        detail.idPurchaseDetail
      );

      if (!idPurchaseDetail) {
        return grouped;
      }

      const details = grouped.get(idPurchaseDetail) ?? [];
      details.push(detail);
      grouped.set(idPurchaseDetail, details);

      return grouped;
    }, new Map());

  return purchaseDetails.reduce((availabilityByDetail, detail) => {
    const idPurchaseDetail = Number(
      detail.id_purchase_detail ??
      detail.purchaseDetailId ??
      detail.idPurchaseDetail ??
      detail.id
    );

    if (!idPurchaseDetail) {
      return availabilityByDetail;
    }

    availabilityByDetail.set(
      idPurchaseDetail,
      calculatePurchaseDetailReturnAvailability({
        purchasedQuantity: detail.quantity,
        returnDetails:
          returnDetailsByPurchaseDetail.get(idPurchaseDetail) ?? [],
      })
    );

    return availabilityByDetail;
  }, new Map());
};

export const validateReturnQuantity = ({
  requestedQuantity,
  purchasedQuantity,
  returnedQuantity = 0,
}) => {
  const availableQuantity =
    calculateAvailableQuantity({
      purchasedQuantity,
      returnedQuantity,
    });

  if (toNumber(requestedQuantity) < 1) {
    return {
      success: false,
      errorCode: "INVALID_RETURN_QUANTITY",
      error: "La cantidad a devolver debe ser mayor a cero.",
      availableQuantity,
    };
  }

  if (toNumber(requestedQuantity) > availableQuantity) {
    return {
      success: false,
      errorCode: "RETURN_QUANTITY_EXCEEDED",
      error: `La cantidad a devolver supera la cantidad disponible (${availableQuantity}).`,
      availableQuantity,
    };
  }

  return {
    success: true,
    errorCode: null,
    error: null,
    availableQuantity,
  };
};

export const isReadyStatus = (idReturnStatus) =>
  Number(idReturnStatus) === RETURN_DETAIL_STATUS_IDS.READY;

export const validateDetailIsEditable = (detail) => {
  if (isReadyStatus(detail?.id_return_status ?? detail?.returnStatusId)) {
    return {
      success: false,
      errorCode: "RETURN_DETAIL_ALREADY_READY",
      error: "Un producto en estado Listo no puede modificarse.",
    };
  }

  return {
    success: true,
    errorCode: null,
    error: null,
  };
};

export const getAllowedNextStatuses = (idReturnMethod, currentStatusId) => {
  const flow =
    DETAIL_STATUS_FLOW_BY_METHOD[
      Number(idReturnMethod)
    ];

  if (!flow) return [];

  return flow[
    Number(currentStatusId)
  ] || [];
};

export const validateDetailStatusTransition = ({
  idReturnMethod,
  currentStatusId,
  nextStatusId,
}) => {
  if (isReadyStatus(currentStatusId)) {
    return {
      success: false,
      errorCode: "RETURN_DETAIL_ALREADY_READY",
      error: "Un producto en estado Listo no puede modificarse.",
    };
  }

  const allowedNextStatuses =
    getAllowedNextStatuses(
      idReturnMethod,
      currentStatusId
    );

  if (!allowedNextStatuses.includes(Number(nextStatusId))) {
    return {
      success: false,
      errorCode: "INVALID_RETURN_STATUS_FLOW",
      error: "El cambio de estado no es valido para el metodo de devolucion.",
      allowedNextStatuses,
    };
  }

  return {
    success: true,
    errorCode: null,
    error: null,
    allowedNextStatuses,
  };
};

export const shouldRestoreStockOnReady = ({
  idReturnMethod,
  currentStatusId,
  nextStatusId,
}) =>
  Number(idReturnMethod) === RETURN_METHOD_IDS.REPLACEMENT &&
  !isReadyStatus(currentStatusId) &&
  isReadyStatus(nextStatusId);

export const getReturnProgress = (details = []) => {
  const total = details.length;
  const completed = details.filter((detail) =>
    isReadyStatus(
      detail.id_return_status ??
      detail.returnStatusId
    )
  ).length;

  return {
    completed,
    total,
    label: `${completed}/${total}`,
  };
};

export const calculateReturnLifecycle = ({
  details = [],
  isAnnulled = false,
}) => {
  if (isAnnulled) {
    return RETURN_LIFECYCLE.ANNULLED;
  }

  if (
    details.length > 0 &&
    details.every((detail) =>
      isReadyStatus(
        detail.id_return_status ??
        detail.returnStatusId
      )
    )
  ) {
    return RETURN_LIFECYCLE.COMPLETED;
  }

  return RETURN_LIFECYCLE.IN_PROCESS;
};

export const calculatePurchaseStatusFromReturns = (returns = []) => {
  if (!returns.length) {
    return PURCHASE_STATUS_IDS.COMPLETED;
  }

  const lifecycles = returns.map((purchaseReturn) =>
    purchaseReturn.lifecycle ||
    calculateReturnLifecycle({
      details:
        purchaseReturn.prd ??
        purchaseReturn.details ??
        [],
      isAnnulled:
        purchaseReturn.isAnnulled ||
        isAnnulledStatus(
          purchaseReturn.id_return_status ??
          purchaseReturn.returnStatusId ??
          purchaseReturn.statusId
        ),
    })
  );

  const hasInProcess =
    lifecycles.includes(
      RETURN_LIFECYCLE.IN_PROCESS
    );

  const hasAnnulled =
    lifecycles.includes(
      RETURN_LIFECYCLE.ANNULLED
    );

  if (hasInProcess && hasAnnulled) {
    return PURCHASE_STATUS_IDS.RETURN_IN_PROCESS_WITH_ANNULLED_RETURNS;
  }

  if (hasInProcess) {
    return PURCHASE_STATUS_IDS.RETURN_IN_PROCESS;
  }

  if (hasAnnulled) {
    return PURCHASE_STATUS_IDS.COMPLETED_WITH_ANNULLED_RETURNS;
  }

  return PURCHASE_STATUS_IDS.COMPLETED_WITH_RETURNS;
};
