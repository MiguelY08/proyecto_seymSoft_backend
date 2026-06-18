import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

export const getPurchaseReturnByIdUseCase = async (idPurchaseReturn) => {
  try {
    if (
      !idPurchaseReturn ||
      isNaN(idPurchaseReturn) ||
      Number(idPurchaseReturn) < 1
    ) {
      return {
        success: false,
        data: null,
        error: "ID de devolucion invalido.",
        errorCode: "VALIDATION_ERROR",
      };
    }

    const purchaseReturn =
      await PurchaseReturnRepository.findById(
        Number(idPurchaseReturn)
      );

    if (!purchaseReturn) {
      return {
        success: false,
        data: null,
        error: "Devolucion de compra no encontrada.",
        errorCode: "PURCHASE_RETURN_NOT_FOUND",
      };
    }

    return {
      success: true,
      data: purchaseReturn,
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetPurchaseReturnByIdUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error al obtener la devolucion de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const getById =
  getPurchaseReturnByIdUseCase;
