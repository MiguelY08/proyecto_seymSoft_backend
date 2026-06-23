import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

export const validateReturnCatalogReferences = async (detail) => {
  const [returnReason, returnMethod] = await Promise.all([
    PurchaseReturnRepository.findReturnReasonById(
      Number(detail.idReturnReason)
    ),
    PurchaseReturnRepository.findReturnMethodById(
      Number(detail.idReturnMethod)
    ),
  ]);

  if (!returnReason) {
    return {
      success: false,
      error: `El motivo de devolucion ${detail.idReturnReason} no existe.`,
      errorCode: "RETURN_REASON_NOT_FOUND",
      meta: {
        idReturnReason: detail.idReturnReason,
      },
    };
  }

  if (!returnMethod) {
    return {
      success: false,
      error: `El metodo de devolucion ${detail.idReturnMethod} no existe.`,
      errorCode: "RETURN_METHOD_NOT_FOUND",
      meta: {
        idReturnMethod: detail.idReturnMethod,
      },
    };
  }

  return {
    success: true,
    error: null,
    errorCode: null,
  };
};
